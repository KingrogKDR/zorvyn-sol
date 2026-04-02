import { ApiError } from "../utils/apiError.js";
import { ROLES } from "../utils/constants.js";
import db from "./connection.js";

function initDB() {
    try {
        db.exec(`PRAGMA foreign_keys = ON;`);
        db.exec(`
        CREATE TABLE IF NOT EXISTS role (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role_name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role_id INTEGER,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (role_id) REFERENCES role(id)
        );
        `);

        console.log("Database & tables created");
    } catch (error) {
        throw new ApiError(500, "Database initialization failed", {
            code: "DB_INIT_FAILED",
            details: error.message,
        })
    }
}

function seedDB() {

    const insertRole = db.prepare(`
        INSERT OR IGNORE INTO role (role_name) VALUES (?)
    `);

    Object.values(ROLES).forEach(role => {
        insertRole.run(role);
    });

    console.log("RBAC seeded");
}

export { initDB, seedDB };

