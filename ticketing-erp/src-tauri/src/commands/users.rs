// User management commands (Admin only)

use crate::models::*;
use crate::commands::auth::require_auth;
use rusqlite::params;
use bcrypt::{hash, DEFAULT_COST};

fn map_user(row: &rusqlite::Row<'_>) -> rusqlite::Result<User> {
    Ok(User {
        id: row.get(0)?,
        username: row.get(1)?,
        full_name: row.get(2)?,
        role: row.get(3)?,
        department: row.get(4)?,
        is_active: row.get::<_, i32>(5)? != 0,
        created_at: row.get(6)?,
    })
}

#[tauri::command]
pub fn get_users(
    state: tauri::State<'_, crate::AppState>,
    token: String,
) -> Result<Vec<User>, String> {
    let actor = require_auth(&state, &token)?;
    if actor.role != "admin" {
        return Err("Akses ditolak".into());
    }

    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, username, full_name, role, department, is_active, created_at
         FROM users ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;

    let users: Vec<User> = stmt.query_map([], map_user)
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(users)
}

#[tauri::command]
pub fn create_user(
    state: tauri::State<'_, crate::AppState>,
    token: String,
    payload: CreateUserPayload,
) -> Result<User, String> {
    let actor = require_auth(&state, &token)?;
    if actor.role != "admin" {
        return Err("Akses ditolak".into());
    }

    let password_hash = hash(&payload.password, DEFAULT_COST)
        .map_err(|e| e.to_string())?;

    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO users (username, password_hash, full_name, role, department)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![payload.username, password_hash, payload.full_name, payload.role, payload.department],
    ).map_err(|e| {
        if e.to_string().contains("UNIQUE") {
            "Username sudah digunakan".to_string()
        } else {
            e.to_string()
        }
    })?;

    let user_id = conn.last_insert_rowid();
    let user = conn.query_row(
        "SELECT id, username, full_name, role, department, is_active, created_at FROM users WHERE id = ?1",
        params![user_id],
        map_user,
    ).map_err(|e| e.to_string())?;

    Ok(user)
}

#[tauri::command]
pub fn update_user(
    state: tauri::State<'_, crate::AppState>,
    token: String,
    id: i64,
    payload: UpdateUserPayload,
) -> Result<User, String> {
    let actor = require_auth(&state, &token)?;
    if actor.role != "admin" {
        return Err("Akses ditolak".into());
    }

    let conn = state.db.lock().map_err(|e| e.to_string())?;

    if let Some(full_name) = &payload.full_name {
        conn.execute("UPDATE users SET full_name = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![full_name, id]).map_err(|e| e.to_string())?;
    }
    if let Some(role) = &payload.role {
        conn.execute("UPDATE users SET role = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![role, id]).map_err(|e| e.to_string())?;
    }
    if let Some(department) = &payload.department {
        conn.execute("UPDATE users SET department = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![department, id]).map_err(|e| e.to_string())?;
    }
    if let Some(is_active) = payload.is_active {
        conn.execute("UPDATE users SET is_active = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![is_active as i32, id]).map_err(|e| e.to_string())?;
    }

    let user = conn.query_row(
        "SELECT id, username, full_name, role, department, is_active, created_at FROM users WHERE id = ?1",
        params![id],
        map_user,
    ).map_err(|e| e.to_string())?;

    Ok(user)
}

#[tauri::command]
pub fn reset_password(
    state: tauri::State<'_, crate::AppState>,
    token: String,
    user_id: i64,
    new_password: String,
) -> Result<(), String> {
    let actor = require_auth(&state, &token)?;
    if actor.role != "admin" {
        return Err("Akses ditolak".into());
    }

    let password_hash = hash(&new_password, DEFAULT_COST)
        .map_err(|e| e.to_string())?;

    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE users SET password_hash = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![password_hash, user_id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}
