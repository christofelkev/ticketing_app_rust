// Tauri app library — registers all commands and initializes DB

mod models;
mod db;
mod commands;

use std::sync::Mutex;
use rusqlite::Connection;
use tauri::Manager;

pub struct AppState {
    pub db: Mutex<Connection>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .setup(|app| {
            // Initialize database
            let db_path = db::get_db_path(app.handle());
            let conn = db::init_db(&db_path)
                .expect("Failed to initialize database");

            app.manage(AppState {
                db: Mutex::new(conn),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth
            commands::auth::login,
            commands::auth::logout,
            commands::auth::get_current_user,
            // Tickets
            commands::tickets::get_tickets,
            commands::tickets::get_ticket,
            commands::tickets::create_ticket,
            commands::tickets::update_ticket_status,
            commands::tickets::assign_ticket,
            commands::tickets::get_staff_by_department,
            // Users
            commands::users::get_users,
            commands::users::create_user,
            commands::users::update_user,
            commands::users::reset_password,
            // Comments
            commands::comments::add_comment,
            // Notifications
            commands::notifications::get_notifications,
            commands::notifications::mark_notification_read,
            commands::notifications::mark_all_notifications_read,
            // Dashboard
            commands::dashboard::get_dashboard_stats,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
