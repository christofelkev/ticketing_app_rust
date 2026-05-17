// Database connection and initialization

use rusqlite::{Connection, Result, params};
use std::sync::Mutex;
use once_cell::sync::Lazy;
use tauri::{AppHandle, Manager};
use std::path::PathBuf;

pub type DbConnection = Mutex<Connection>;

pub static DB: Lazy<Mutex<Option<Connection>>> = Lazy::new(|| Mutex::new(None));

pub fn get_db_path(app: &AppHandle) -> PathBuf {
    let data_dir = app.path().app_data_dir()
        .expect("Failed to get app data dir");
    std::fs::create_dir_all(&data_dir).ok();
    data_dir.join("ticketing.db")
}

pub fn init_db(db_path: &PathBuf) -> Result<Connection> {
    let conn = Connection::open(db_path)?;

    // Enable WAL mode for better concurrent access
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;

    // Run migrations
    run_migrations(&conn)?;

    Ok(conn)
}

fn run_migrations(conn: &Connection) -> Result<()> {
    conn.execute_batch(include_str!("migrations/001_init.sql"))?;
    Ok(())
}

// Helper: get user by id
pub fn get_user_by_id(conn: &Connection, id: i64) -> Result<Option<crate::models::User>> {
    let mut stmt = conn.prepare(
        "SELECT id, username, full_name, role, department, is_active, created_at
         FROM users WHERE id = ?1"
    )?;
    let result = stmt.query_row(params![id], |row| {
        Ok(crate::models::User {
            id: row.get(0)?,
            username: row.get(1)?,
            full_name: row.get(2)?,
            role: row.get(3)?,
            department: row.get(4)?,
            is_active: row.get::<_, i32>(5)? != 0,
            created_at: row.get(6)?,
        })
    });
    match result {
        Ok(u) => Ok(Some(u)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}
