// Comments commands

use crate::models::*;
use crate::commands::auth::require_auth;
use rusqlite::params;
use chrono::Utc;

#[tauri::command]
pub fn add_comment(
    state: tauri::State<'_, crate::AppState>,
    token: String,
    ticket_id: i64,
    content: String,
) -> Result<Comment, String> {
    let actor = require_auth(&state, &token)?;
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO comments (ticket_id, user_id, content, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![ticket_id, actor.id, content, now],
    ).map_err(|e| e.to_string())?;

    let comment_id = conn.last_insert_rowid();

    // Log activity
    conn.execute(
        "INSERT INTO activity_log (ticket_id, user_id, action, created_at) VALUES (?1, ?2, 'COMMENT', ?3)",
        params![ticket_id, actor.id, now],
    ).map_err(|e| e.to_string())?;

    // Notify ticket participants
    let (requester_id, assignee_id, ticket_no): (i64, Option<i64>, String) = conn.query_row(
        "SELECT requester_id, assignee_id, ticket_no FROM tickets WHERE id = ?1",
        params![ticket_id],
        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
    ).map_err(|e| e.to_string())?;

    let msg = format!("Komentar baru di ticket {}", ticket_no);
    for uid in [Some(requester_id), assignee_id].iter().flatten() {
        if *uid != actor.id {
            conn.execute(
                "INSERT INTO notifications (user_id, ticket_id, message) VALUES (?1, ?2, ?3)",
                params![uid, ticket_id, &msg],
            ).ok();
        }
    }

    Ok(Comment {
        id: comment_id,
        ticket_id,
        user: actor,
        content: content.clone(),
        created_at: now,
    })
}
