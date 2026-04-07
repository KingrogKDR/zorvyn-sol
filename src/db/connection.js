import Database from "better-sqlite3";

const db = new Database("vyn.db");

// enable foreign keys globally
db.exec("PRAGMA foreign_keys = ON;");

export default db;