import bcrypt from "bcrypt";
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
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (role_id) REFERENCES role(id)
        );
        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL CHECK (amount >= 0),
            type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
            category TEXT NOT NULL,
            date INTEGER NOT NULL,
            notes TEXT,
            created_at INTEGER DEFAULT (strftime('%s','now')),
            updated_at INTEGER DEFAULT (strftime('%s','now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_user_type ON records(user_id, type);
        CREATE INDEX IF NOT EXISTS idx_user_category ON records(user_id, category);
        CREATE INDEX IF NOT EXISTS idx_user_date ON records(user_id, date);
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

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    const existingAdmin = db
        .prepare(`SELECT id FROM users WHERE email = ?`)
        .get(adminEmail);

    if (existingAdmin) {
        console.log("Admin already exists");
        return;
    }

    const adminRole = db
        .prepare(`SELECT id FROM role WHERE role_name = ?`)
        .get(ROLES.ADMIN);

    if (!adminRole) {
        throw new Error("Admin role not found during seeding");
    }

    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
    db.prepare(`
        INSERT INTO users (email, password, role_id)
        VALUES (?, ?, ?)
    `).run(adminEmail, hashedPassword, adminRole.id);

    console.log("Admin user created");
}

export { initDB, seedDB };

