// Notification commands

use crate::models::Notification;
use crate::commands::auth::require_auth;
use rusqlite::params;

#[tauri::command]
pub fn get_notifications(
    state: tauri::State<'_, crate::AppState>,
    token: String,
    user_id: i64,
) -> Result<Vec<Notification>, String> {
    require_auth(&state, &token)?;
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT n.id, n.user_id, n.ticket_id, t.ticket_no, n.message, n.is_read, n.created_at
         FROM notifications n
         LEFT JOIN tickets t ON t.id = n.ticket_id
         WHERE n.user_id = ?1
         ORDER BY n.created_at DESC
         LIMIT 30"
    ).map_err(|e| e.to_string())?;

    let notifs: Vec<Notification> = stmt.query_map(params![user_id], |row| {
        Ok(Notification {
            id: row.get(0)?,
            user_id: row.get(1)?,
            ticket_id: row.get(2)?,
            ticket_no: row.get(3)?,
            message: row.get(4)?,
            is_read: row.get::<_, i32>(5)? != 0,
            created_at: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    Ok(notifs)
}

#[tauri::command]
pub fn mark_notification_read(
    state: tauri::State<'_, crate::AppState>,
    token: String,
    id: i64,
) -> Result<(), String> {
    require_auth(&state, &token)?;
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("UPDATE notifications SET is_read = 1 WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn mark_all_notifications_read(
    state: tauri::State<'_, crate::AppState>,
    token: String,
    user_id: i64,
) -> Result<(), String> {
    require_auth(&state, &token)?;
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?1", params![user_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
