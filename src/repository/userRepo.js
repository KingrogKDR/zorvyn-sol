import db from "../db/connection.js";
import { ApiError } from "../utils/apiError.js";
import { ROLES } from "../utils/constants.js";
import { getRoleIdByName } from "./roleRepo.js";

function findByEmail(email) {
    const query = `
        SELECT id, email, password, role_id, status, created_at
        FROM users
        WHERE email = ?
    `;

    return db.prepare(query).get(email) || null;
}

function findById(userId) {
    const query = `
        SELECT id, role_id, status
        FROM users
        WHERE id = ?
    `
    return db.prepare(query).get(userId) || null;
}

function createUser(email, password) {
    const viewerRoleId = getRoleIdByName(ROLES.VIEWER)

    const query = `
        INSERT INTO users (email, password, role_id) VALUES (?, ?, ?)
    `

    const result = db.prepare(query).run(
        email,
        password,
        viewerRoleId,
    );
    return result.lastInsertRowid;
}

function getAllUsers() {
    const query = `
        SELECT
            u.id,
            u.email,
            r.role_name as role,
            u.status
        FROM users u
        LEFT JOIN role r ON u.role_id = r.id
    `
    return db.prepare(query).all();
}

function getUserById(userId) {
    const query = `
        SELECT
            u.id,
            u.email,
            u.status,
            r.role_name as role,
            u.created_at
        FROM users u
        LEFT JOIN role r ON u.role_id = r.id
        WHERE u.id = ?
    `;

    return db.prepare(query).get(userId) || null;
}

function updateUserById(userId, { role_id, status }) {
    const query = `
        UPDATE users
        SET role_id = COALESCE(?, role_id),
            status = COALESCE(?, status)
        WHERE id = ?
    `;

    return db.prepare(query).run(role_id, status, userId);
}

function clearAllTables() {
    const tables = ["users", "role", "permission", "role_permissions"];

    const tx = db.transaction(() => {
        db.exec("PRAGMA foreign_keys = OFF;");

        tables.forEach((table) => {
            db.prepare(`DELETE FROM ${table}`).run();
        });

        db.exec("PRAGMA foreign_keys = ON;");
    });

    tx();
}

const ALLOWED_TABLES = ["users", "role", "permission", "role_permissions"]; // validating for avoiding SQL injection

function clearTable(tableName) {
    if (!ALLOWED_TABLES.includes(tableName)) {
        throw new ApiError(500, "Invalid table name");
    }

    db.prepare(`DELETE FROM ${tableName}`).run();
}

export { clearAllTables, clearTable, createUser, findByEmail, findById, getAllUsers, getUserById, updateUserById };



