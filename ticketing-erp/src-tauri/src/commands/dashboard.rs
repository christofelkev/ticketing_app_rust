// Dashboard stats command

use crate::models::*;
use crate::commands::auth::require_auth;
use rusqlite::params;
use chrono::{Utc, Duration, Datelike};

fn row_to_ticket_simple(
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

    let is_overdue = sla_due.as_ref().map(|d| {
        let now = Utc::now().to_rfc3339();
        status != "CLOSED" && status != "RESOLVED" && now > *d
    }).unwrap_or(false);

    let requester = crate::db::get_user_by_id(conn, requester_id)?.unwrap_or_else(|| User {
        id: requester_id, username: "unknown".into(), full_name: "Unknown".into(),
        role: "requester".into(), department: "IT".into(), is_active: false, created_at: "".into(),
    });
    let assignee = assignee_id.and_then(|aid| crate::db::get_user_by_id(conn, aid).ok().flatten());

    Ok(TicketWithUsers {
        id, ticket_no, title, description, category, priority, status,
        requester, assignee, sla_due, desired_due, resolved_at, closed_at,
        created_at, updated_at, comment_count: 0, is_overdue,
    })
}

#[tauri::command]
pub fn get_dashboard_stats(
    state: tauri::State<'_, crate::AppState>,
    token: String,
) -> Result<DashboardStats, String> {
    let actor = require_auth(&state, &token)?;
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let dept_filter = match actor.role.as_str() {
        "manager" => format!("AND t.category = '{}'", actor.department),
        _ => String::new(),
    };

    let now = Utc::now();
    let month_start = format!("{}-{:02}-01", now.year(), now.month());

    let count_q = |extra_where: &str| -> Result<i64, String> {
        conn.query_row(
            &format!("SELECT COUNT(*) FROM tickets t WHERE 1=1 {} {}", dept_filter, extra_where),
            [],
            |r| r.get(0),
        ).map_err(|e| e.to_string())
    };

    let total_open = count_q("AND t.status = 'OPEN'")?;
    let total_in_progress = count_q("AND t.status = 'IN_PROGRESS'")?;
    let total_overdue = count_q(&format!(
        "AND t.sla_due < '{}' AND t.status NOT IN ('CLOSED','RESOLVED')",
        now.to_rfc3339()
    ))?;
    let total_resolved_this_month = count_q(&format!(
        "AND t.resolved_at >= '{}' AND t.status IN ('RESOLVED','CLOSED')", month_start
    ))?;

    let categories = ["IT", "MNT", "HR", "PRC"];
    let by_category: Vec<CategoryCount> = categories.iter().map(|cat| {
        let c: i64 = conn.query_row(
            &format!("SELECT COUNT(*) FROM tickets t WHERE t.category = ?1 {}", dept_filter),
            params![cat], |r| r.get(0),
        ).unwrap_or(0);
        CategoryCount { category: cat.to_string(), count: c }
    }).collect();

    // Weekly trend (4 weeks)
    let trend_weekly: Vec<WeeklyTrend> = (0..4).rev().map(|i| {
        let week_start = now - Duration::weeks(i + 1);
        let week_end = now - Duration::weeks(i);
        let c: i64 = conn.query_row(
            &format!("SELECT COUNT(*) FROM tickets t WHERE t.created_at >= ?1 AND t.created_at < ?2 {}", dept_filter),
            params![week_start.to_rfc3339(), week_end.to_rfc3339()],
            |r| r.get(0),
        ).unwrap_or(0);
        WeeklyTrend { week: format!("W{}", 4 - i), count: c }
    }).collect();

    // Overdue tickets
    let overdue_sql = format!(
        "SELECT t.id, t.ticket_no, t.title, t.description, t.category, t.priority,
                t.status, t.requester_id, t.assignee_id, t.sla_due, t.desired_due,
                t.resolved_at, t.closed_at, t.created_at, t.updated_at
         FROM tickets t
         WHERE t.sla_due < '{}' AND t.status NOT IN ('CLOSED','RESOLVED') {}
         ORDER BY t.sla_due ASC LIMIT 5",
        now.to_rfc3339(), dept_filter
    );
    let mut stmt = conn.prepare(&overdue_sql).map_err(|e| e.to_string())?;
    let overdue_tickets: Vec<TicketWithUsers> = stmt.query_map([], |row| row_to_ticket_simple(&conn, row))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    // Top unresolved
    let unresolved_sql = format!(
        "SELECT t.id, t.ticket_no, t.title, t.description, t.category, t.priority,
                t.status, t.requester_id, t.assignee_id, t.sla_due, t.desired_due,
                t.resolved_at, t.closed_at, t.created_at, t.updated_at
         FROM tickets t
         WHERE t.status NOT IN ('CLOSED','RESOLVED') {}
         ORDER BY t.created_at ASC LIMIT 5",
        dept_filter
    );
    let mut stmt2 = conn.prepare(&unresolved_sql).map_err(|e| e.to_string())?;
    let top_unresolved: Vec<TicketWithUsers> = stmt2.query_map([], |row| row_to_ticket_simple(&conn, row))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(DashboardStats {
        total_open, total_in_progress, total_overdue, total_resolved_this_month,
        by_category, trend_weekly, overdue_tickets, top_unresolved,
    })
}
