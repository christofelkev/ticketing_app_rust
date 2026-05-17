// Ticket CRUD commands

use crate::models::*;
use crate::db::get_user_by_id;
use crate::commands::auth::require_auth;
use rusqlite::params;
use chrono::{Utc, Duration};

fn sla_hours_for_priority(priority: &str) -> i64 {
    match priority {
        "P1" => 4,
        "P2" => 8,
        "P3" => 24,
        "P4" => 72,
        _ => 24,
    }
}

fn category_month_counter(conn: &rusqlite::Connection, category: &str) -> i64 {
    let year_month = Utc::now().format("%Y%m").to_string();
    conn.query_row(
        "SELECT COUNT(*) FROM tickets WHERE category = ?1 AND ticket_no LIKE ?2",
        params![category, format!("{}-{}-%%", category, year_month)],
        |row| row.get(0),
    ).unwrap_or(0)
}

fn generate_ticket_no(conn: &rusqlite::Connection, category: &str) -> String {
    let year_month = Utc::now().format("%Y%m").to_string();
    let count = category_month_counter(conn, category) + 1;
    format!("{}-{}-{:04}", category, year_month, count)
}

fn row_to_ticket_with_users(
    conn: &rusqlite::Connection,
    row: &rusqlite::Row<'_>,
) -> rusqlite::Result<TicketWithUsers> {
    let id: i64 = row.get(0)?;
    let ticket_no: String = row.get(1)?;
    let title: String = row.get(2)?;
    let description: String = row.get(3)?;
    let category: String = row.get(4)?;
    let priority: String = row.get(5)?;
    let status: String = row.get(6)?;
    let requester_id: i64 = row.get(7)?;
    let assignee_id: Option<i64> = row.get(8)?;
    let sla_due: Option<String> = row.get(9)?;
    let desired_due: Option<String> = row.get(10)?;
    let resolved_at: Option<String> = row.get(11)?;
    let closed_at: Option<String> = row.get(12)?;
    let created_at: String = row.get(13)?;
    let updated_at: String = row.get(14)?;
    let comment_count: i64 = row.get(15)?;

    // Check overdue
    let is_overdue = sla_due.as_ref().map(|d| {
        let now = Utc::now().to_rfc3339();
        status != "CLOSED" && status != "RESOLVED" && now > *d
    }).unwrap_or(false);

    let requester = get_user_by_id(conn, requester_id)?
        .unwrap_or_else(|| User {
            id: requester_id, username: "unknown".into(), full_name: "Unknown".into(),
            role: "requester".into(), department: "IT".into(), is_active: false,
            created_at: "".into(),
        });

    let assignee = assignee_id
        .and_then(|aid| get_user_by_id(conn, aid).ok().flatten());

    Ok(TicketWithUsers {
        id, ticket_no, title, description, category, priority, status,
        requester, assignee, sla_due, desired_due, resolved_at, closed_at,
        created_at, updated_at, comment_count, is_overdue,
    })
}

#[tauri::command]
pub fn get_tickets(
    state: tauri::State<'_, crate::AppState>,
    token: String,
    filter: TicketFilter,
    page: i64,
    limit: i64,
) -> Result<PaginatedTickets, String> {
    let actor = require_auth(&state, &token)?;
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let mut conditions: Vec<String> = Vec::new();
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    // Role-based filtering
    match actor.role.as_str() {
        "staff" => {
            conditions.push("t.assignee_id = ?".to_string());
            params_vec.push(Box::new(actor.id));
        }
        "requester" => {
            conditions.push("t.requester_id = ?".to_string());
            params_vec.push(Box::new(actor.id));
        }
        "manager" => {
            conditions.push("t.category = ?".to_string());
            params_vec.push(Box::new(actor.department.clone()));
        }
        _ => {} // admin: no restriction
    }

    if let Some(cat) = &filter.category {
        conditions.push("t.category = ?".to_string());
        params_vec.push(Box::new(cat.clone()));
    }
    if let Some(status) = &filter.status {
        conditions.push("t.status = ?".to_string());
        params_vec.push(Box::new(status.clone()));
    }
    if let Some(priority) = &filter.priority {
        conditions.push("t.priority = ?".to_string());
        params_vec.push(Box::new(priority.clone()));
    }
    if let Some(search) = &filter.search {
        conditions.push("(t.title LIKE ? OR t.ticket_no LIKE ? OR t.description LIKE ?)".to_string());
        let like = format!("%{}%", search);
        params_vec.push(Box::new(like.clone()));
        params_vec.push(Box::new(like.clone()));
        params_vec.push(Box::new(like));
    }

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };

    let count_sql = format!(
        "SELECT COUNT(*) FROM tickets t {}",
        where_clause
    );
    let data_sql = format!(
        "SELECT t.id, t.ticket_no, t.title, t.description, t.category, t.priority,
                t.status, t.requester_id, t.assignee_id, t.sla_due, t.desired_due,
                t.resolved_at, t.closed_at, t.created_at, t.updated_at,
                (SELECT COUNT(*) FROM comments c WHERE c.ticket_id = t.id) as comment_count
         FROM tickets t {}
         ORDER BY
           CASE WHEN t.sla_due < datetime('now') AND t.status NOT IN ('CLOSED','RESOLVED') THEN 0 ELSE 1 END,
           t.created_at DESC
         LIMIT ? OFFSET ?",
        where_clause
    );

    // Build params as references
    let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();

    let total: i64 = conn.query_row(
        &count_sql,
        rusqlite::params_from_iter(params_refs.iter().map(|p| *p)),
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    let offset = (page - 1) * limit;
    let mut all_params: Vec<Box<dyn rusqlite::ToSql>> = params_vec;
    all_params.push(Box::new(limit));
    all_params.push(Box::new(offset));
    let all_refs: Vec<&dyn rusqlite::ToSql> = all_params.iter().map(|p| p.as_ref()).collect();

    let mut stmt = conn.prepare(&data_sql).map_err(|e| e.to_string())?;
    let tickets: Vec<TicketWithUsers> = stmt.query_map(
        rusqlite::params_from_iter(all_refs.iter().map(|p| *p)),
        |row| row_to_ticket_with_users(&conn, row),
    ).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    Ok(PaginatedTickets { data: tickets, total, page, limit })
}

#[tauri::command]
pub fn get_ticket(
    state: tauri::State<'_, crate::AppState>,
    token: String,
    id: i64,
) -> Result<TicketDetail, String> {
    require_auth(&state, &token)?;
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let ticket = conn.query_row(
        "SELECT t.id, t.ticket_no, t.title, t.description, t.category, t.priority,
                t.status, t.requester_id, t.assignee_id, t.sla_due, t.desired_due,
                t.resolved_at, t.closed_at, t.created_at, t.updated_at,
                (SELECT COUNT(*) FROM comments c WHERE c.ticket_id = t.id) as comment_count
         FROM tickets t WHERE t.id = ?1",
        params![id],
        |row| row_to_ticket_with_users(&conn, row),
    ).map_err(|e| e.to_string())?;

    // Fetch comments
    let mut stmt = conn.prepare(
        "SELECT c.id, c.ticket_id, c.user_id, c.content, c.created_at FROM comments c WHERE c.ticket_id = ?1 ORDER BY c.created_at ASC"
    ).map_err(|e| e.to_string())?;
    let comments: Vec<Comment> = stmt.query_map(params![id], |row| {
        let user_id: i64 = row.get(2)?;
        Ok((row.get(0)?, row.get(1)?, user_id, row.get::<_, String>(3)?, row.get::<_, String>(4)?))
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .filter_map(|(cid, ticket_id, user_id, content, created_at)| {
        get_user_by_id(&conn, user_id).ok().flatten().map(|user| Comment {
            id: cid, ticket_id, user, content, created_at
        })
    })
    .collect();

    // Fetch activity log
    let mut stmt2 = conn.prepare(
        "SELECT id, ticket_id, user_id, action, old_value, new_value, created_at
         FROM activity_log WHERE ticket_id = ?1 ORDER BY created_at ASC"
    ).map_err(|e| e.to_string())?;
    let activity_log: Vec<ActivityLog> = stmt2.query_map(params![id], |row| {
        Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?, row.get::<_, i64>(2)?,
            row.get::<_, String>(3)?, row.get::<_, Option<String>>(4)?,
            row.get::<_, Option<String>>(5)?, row.get::<_, String>(6)?))
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .filter_map(|(lid, ticket_id, user_id, action, old_value, new_value, created_at)| {
        get_user_by_id(&conn, user_id).ok().flatten().map(|user| ActivityLog {
            id: lid, ticket_id, user, action, old_value, new_value, created_at
        })
    })
    .collect();

    Ok(TicketDetail { ticket, comments, attachments: vec![], activity_log })
}

#[tauri::command]
pub fn create_ticket(
    state: tauri::State<'_, crate::AppState>,
    token: String,
    payload: CreateTicketPayload,
) -> Result<TicketWithUsers, String> {
    let actor = require_auth(&state, &token)?;
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let ticket_no = generate_ticket_no(&conn, &payload.category);
    let sla_hours = sla_hours_for_priority(&payload.priority);
    let sla_due = (Utc::now() + Duration::hours(sla_hours)).to_rfc3339();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO tickets (ticket_no, title, description, category, priority, status, requester_id, sla_due, desired_due, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, 'OPEN', ?6, ?7, ?8, ?9, ?9)",
        params![ticket_no, payload.title, payload.description, payload.category, payload.priority,
                actor.id, sla_due, payload.desired_due, now],
    ).map_err(|e| e.to_string())?;

    let ticket_id = conn.last_insert_rowid();

    // Log create activity
    conn.execute(
        "INSERT INTO activity_log (ticket_id, user_id, action, new_value, created_at)
         VALUES (?1, ?2, 'CREATE', ?3, ?4)",
        params![ticket_id, actor.id, &ticket_no, now],
    ).map_err(|e| e.to_string())?;

    // Notify managers of this department
    let managers: Vec<i64> = conn.prepare(
        "SELECT id FROM users WHERE (department = ?1 OR department = 'ALL') AND role = 'manager' AND is_active = 1"
    ).map_err(|e| e.to_string())?
    .query_map(params![payload.category], |row| row.get(0))
    .map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    let notif_msg = format!("Ticket baru masuk: {}", payload.title);
    for manager_id in managers {
        conn.execute(
            "INSERT INTO notifications (user_id, ticket_id, message) VALUES (?1, ?2, ?3)",
            params![manager_id, ticket_id, &notif_msg],
        ).ok();
    }

    // Return the created ticket
    let ticket = conn.query_row(
        "SELECT t.id, t.ticket_no, t.title, t.description, t.category, t.priority,
                t.status, t.requester_id, t.assignee_id, t.sla_due, t.desired_due,
                t.resolved_at, t.closed_at, t.created_at, t.updated_at,
                0 as comment_count
         FROM tickets t WHERE t.id = ?1",
        params![ticket_id],
        |row| row_to_ticket_with_users(&conn, row),
    ).map_err(|e| e.to_string())?;

    Ok(ticket)
}

#[tauri::command]
pub fn update_ticket_status(
    state: tauri::State<'_, crate::AppState>,
    token: String,
    id: i64,
    status: String,
    comment: Option<String>,
) -> Result<TicketWithUsers, String> {
    let actor = require_auth(&state, &token)?;
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let old_status: String = conn.query_row(
        "SELECT status FROM tickets WHERE id = ?1", params![id], |r| r.get(0)
    ).map_err(|_| "Ticket tidak ditemukan")?;

    let now = Utc::now().to_rfc3339();
    let resolved_update = if status == "RESOLVED" { format!(", resolved_at = '{}'", now) } else { String::new() };
    let closed_update = if status == "CLOSED" { format!(", closed_at = '{}'", now) } else { String::new() };

    conn.execute(
        &format!("UPDATE tickets SET status = ?1, updated_at = ?2{}{} WHERE id = ?3", resolved_update, closed_update),
        params![status, now, id],
    ).map_err(|e| e.to_string())?;

    // Log
    conn.execute(
        "INSERT INTO activity_log (ticket_id, user_id, action, old_value, new_value, created_at)
         VALUES (?1, ?2, 'STATUS_CHANGE', ?3, ?4, ?5)",
        params![id, actor.id, old_status, status, now],
    ).map_err(|e| e.to_string())?;

    // Comment if provided
    if let Some(c) = comment {
        conn.execute(
            "INSERT INTO comments (ticket_id, user_id, content, created_at) VALUES (?1, ?2, ?3, ?4)",
            params![id, actor.id, c, now],
        ).map_err(|e| e.to_string())?;
    }

    let ticket = conn.query_row(
        "SELECT t.id, t.ticket_no, t.title, t.description, t.category, t.priority,
                t.status, t.requester_id, t.assignee_id, t.sla_due, t.desired_due,
                t.resolved_at, t.closed_at, t.created_at, t.updated_at,
                (SELECT COUNT(*) FROM comments c WHERE c.ticket_id = t.id) as comment_count
         FROM tickets t WHERE t.id = ?1",
        params![id],
        |row| row_to_ticket_with_users(&conn, row),
    ).map_err(|e| e.to_string())?;

    Ok(ticket)
}

#[tauri::command]
pub fn assign_ticket(
    state: tauri::State<'_, crate::AppState>,
    token: String,
    id: i64,
    assignee_id: i64,
) -> Result<TicketWithUsers, String> {
    let actor = require_auth(&state, &token)?;
    if actor.role != "admin" && actor.role != "manager" {
        return Err("Akses ditolak".into());
    }

    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().to_rfc3339();

    let assignee = crate::db::get_user_by_id(&conn, assignee_id)
        .map_err(|e| e.to_string())?
        .ok_or("Assignee tidak ditemukan")?;

    conn.execute(
        "UPDATE tickets SET assignee_id = ?1, updated_at = ?2 WHERE id = ?3",
        params![assignee_id, now, id],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO activity_log (ticket_id, user_id, action, new_value, created_at)
         VALUES (?1, ?2, 'ASSIGN', ?3, ?4)",
        params![id, actor.id, assignee.full_name, now],
    ).map_err(|e| e.to_string())?;

    // Notify assignee
    let ticket_no: String = conn.query_row(
        "SELECT ticket_no FROM tickets WHERE id = ?1", params![id], |r| r.get(0)
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO notifications (user_id, ticket_id, message) VALUES (?1, ?2, ?3)",
        params![assignee_id, id, format!("Ticket {} di-assign ke Anda", ticket_no)],
    ).map_err(|e| e.to_string())?;

    let ticket = conn.query_row(
        "SELECT t.id, t.ticket_no, t.title, t.description, t.category, t.priority,
                t.status, t.requester_id, t.assignee_id, t.sla_due, t.desired_due,
                t.resolved_at, t.closed_at, t.created_at, t.updated_at,
                (SELECT COUNT(*) FROM comments c WHERE c.ticket_id = t.id) as comment_count
         FROM tickets t WHERE t.id = ?1",
        params![id],
        |row| row_to_ticket_with_users(&conn, row),
    ).map_err(|e| e.to_string())?;

    Ok(ticket)
}

#[tauri::command]
pub fn get_staff_by_department(
    state: tauri::State<'_, crate::AppState>,
    token: String,
    department: String,
) -> Result<Vec<User>, String> {
    require_auth(&state, &token)?;
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, username, full_name, role, department, is_active, created_at
         FROM users WHERE (department = ?1 OR department = 'ALL') AND role = 'staff' AND is_active = 1"
    ).map_err(|e| e.to_string())?;

    let users: Vec<User> = stmt.query_map(params![department], |row| {
        Ok(User {
            id: row.get(0)?,
            username: row.get(1)?,
            full_name: row.get(2)?,
            role: row.get(3)?,
            department: row.get(4)?,
            is_active: row.get::<_, i32>(5)? != 0,
            created_at: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    Ok(users)
}
