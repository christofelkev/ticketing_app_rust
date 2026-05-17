// Auth commands: login, logout, get_current_user

use crate::models::*;
use crate::db::get_user_by_id;
use rusqlite::params;
use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;
use bcrypt::{verify, hash, DEFAULT_COST};
use uuid::Uuid;

// In-memory session store: token -> user_id
pub static SESSIONS: Lazy<Mutex<HashMap<String, i64>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

#[tauri::command]
pub fn login(
    state: tauri::State<'_, crate::AppState>,
    username: String,
    password: String,
) -> Result<AuthSession, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    // Fetch user
    let result = conn.query_row(
        "SELECT id, password_hash FROM users WHERE username = ?1 AND is_active = 1",
        params![username],
        |row| Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?)),
    );

    let (user_id, password_hash) = match result {
        Ok(v) => v,
        Err(_) => return Err("Username atau password salah".into()),
    };

    // Verify password
    let valid = verify(&password, &password_hash)
        .map_err(|e| e.to_string())?;
    if !valid {
        return Err("Username atau password salah".into());
    }

    // Create session token
    let token = Uuid::new_v4().to_string();
    SESSIONS.lock().unwrap().insert(token.clone(), user_id);

    // Fetch full user
    let user = get_user_by_id(&conn, user_id)
        .map_err(|e| e.to_string())?
        .ok_or("User tidak ditemukan")?;

    Ok(AuthSession { user, token })
}

#[tauri::command]
pub fn logout(token: String) -> Result<(), String> {
    SESSIONS.lock().unwrap().remove(&token);
    Ok(())
}

#[tauri::command]
pub fn get_current_user(
    state: tauri::State<'_, crate::AppState>,
    token: String,
) -> Result<Option<User>, String> {
    let sessions = SESSIONS.lock().unwrap();
    let user_id = match sessions.get(&token) {
        Some(id) => *id,
        None => return Ok(None),
    };
    drop(sessions);

    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let user = get_user_by_id(&conn, user_id).map_err(|e| e.to_string())?;
    Ok(user)
}

/// Helper: get authenticated user from token, returns error if not found
pub fn require_auth(
    state: &tauri::State<'_, crate::AppState>,
    token: &str,
) -> Result<User, String> {
    let sessions = SESSIONS.lock().unwrap();
    let user_id = sessions.get(token).copied()
        .ok_or("Tidak terautentikasi. Silakan login kembali.")?;
    drop(sessions);

    let conn = state.db.lock().map_err(|e| e.to_string())?;
    get_user_by_id(&conn, user_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "User tidak ditemukan".to_string())
}
