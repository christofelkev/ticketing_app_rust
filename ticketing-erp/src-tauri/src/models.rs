// Database models — Rust structs mirroring SQLite schema

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: i64,
    pub username: String,
    pub full_name: String,
    pub role: String,
    pub department: String,
    pub is_active: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ticket {
    pub id: i64,
    pub ticket_no: String,
    pub title: String,
    pub description: String,
    pub category: String,
    pub priority: String,
    pub status: String,
    pub requester_id: i64,
    pub assignee_id: Option<i64>,
    pub sla_due: Option<String>,
    pub desired_due: Option<String>,
    pub resolved_at: Option<String>,
    pub closed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketWithUsers {
    pub id: i64,
    pub ticket_no: String,
    pub title: String,
    pub description: String,
    pub category: String,
    pub priority: String,
    pub status: String,
    pub requester: User,
    pub assignee: Option<User>,
    pub sla_due: Option<String>,
    pub desired_due: Option<String>,
    pub resolved_at: Option<String>,
    pub closed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub comment_count: i64,
    pub is_overdue: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Comment {
    pub id: i64,
    pub ticket_id: i64,
    pub user: User,
    pub content: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityLog {
    pub id: i64,
    pub ticket_id: i64,
    pub user: User,
    pub action: String,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attachment {
    pub id: i64,
    pub ticket_id: i64,
    pub filename: String,
    pub filepath: String,
    pub filesize: i64,
    pub uploaded_by: User,
    pub uploaded_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Notification {
    pub id: i64,
    pub user_id: i64,
    pub ticket_id: Option<i64>,
    pub ticket_no: Option<String>,
    pub message: String,
    pub is_read: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketDetail {
    #[serde(flatten)]
    pub ticket: TicketWithUsers,
    pub comments: Vec<Comment>,
    pub attachments: Vec<Attachment>,
    pub activity_log: Vec<ActivityLog>,
}

// Payload types from frontend
#[derive(Debug, Deserialize)]
pub struct LoginPayload {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTicketPayload {
    pub title: String,
    pub description: String,
    pub category: String,
    pub priority: String,
    pub desired_due: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct TicketFilter {
    pub category: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub assignee_id: Option<i64>,
    pub requester_id: Option<i64>,
    pub search: Option<String>,
    pub date_from: Option<String>,
    pub date_to: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserPayload {
    pub username: String,
    pub password: String,
    pub full_name: String,
    pub role: String,
    pub department: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserPayload {
    pub full_name: Option<String>,
    pub role: Option<String>,
    pub department: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct AuthSession {
    pub user: User,
    pub token: String,
}

#[derive(Debug, Serialize)]
pub struct PaginatedTickets {
    pub data: Vec<TicketWithUsers>,
    pub total: i64,
    pub page: i64,
    pub limit: i64,
}

#[derive(Debug, Serialize)]
pub struct DashboardStats {
    pub total_open: i64,
    pub total_in_progress: i64,
    pub total_overdue: i64,
    pub total_resolved_this_month: i64,
    pub by_category: Vec<CategoryCount>,
    pub trend_weekly: Vec<WeeklyTrend>,
    pub overdue_tickets: Vec<TicketWithUsers>,
    pub top_unresolved: Vec<TicketWithUsers>,
}

#[derive(Debug, Serialize)]
pub struct CategoryCount {
    pub category: String,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct WeeklyTrend {
    pub week: String,
    pub count: i64,
}
