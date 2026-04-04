import db from "../db/connection.js";
import { ApiError } from "../utils/apiError.js";

function createRecord(record) {
    try {
        const query = `
            INSERT INTO records (
                user_id,
                amount,
                type,
                category,
                date,
                notes,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const result = db.prepare(query).run(
            record.user_id,
            record.amount,
            record.type,
            record.category,
            record.date,
            record.notes,
            record.created_at
        );

        return result.lastInsertRowid;
    } catch (error) {
        console.error("DB ERROR:", error.message);
        throw new ApiError(500, "Database createRecord query failed");
    }
}

function getRecordById(id) {
    try {
        const query = `
            SELECT * from records where id = ?
        `
        const result = db.prepare(query).get(id)

        return result
    } catch (error) {
        throw new ApiError(500, "Database getRecordById query failed")
    }
}

function findRecords(filters) {
    try {
        let query = `SELECT * FROM records WHERE 1=1`;
        const values = [];

        if (filters.user_id !== undefined) {
            query += ` AND user_id = ?`;
            values.push(filters.user_id);
        }

        if (filters.type !== undefined) {
            query += ` AND type = ?`;
            values.push(filters.type);
        }

        if (filters.category !== undefined) {
            query += ` AND category = ?`;
            values.push(filters.category);
        }

        if (
            filters.startDate !== undefined &&
            filters.endDate !== undefined
        ) {
            query += ` AND date BETWEEN ? AND ?`;
            values.push(filters.startDate, filters.endDate);
        } else if (filters.startDate !== undefined) {
            query += ` AND date >= ?`;
            values.push(filters.startDate);

        } else if (filters.endDate !== undefined) {
            query += ` AND date <= ?`;
            values.push(filters.endDate);
        }

        query += ` ORDER BY date DESC`
        query += ` LIMIT ? OFFSET ?`;
        values.push(filters.limit, filters.offset);

        return db.prepare(query).all(...values);
    } catch (err) {
        throw new ApiError(500, "Database findRecords query failed");
    }
}

function updateRecordById(recordId, updates) {
    const fields = [];
    const values = [];

    for (const key of Object.keys(updates)) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
    }

    if (fields.length === 0) {
        throw new ApiError(500, "DB error: No fields to update");
    }


    const query = `
        UPDATE records
        SET ${fields.join(", ")}
        WHERE id = ?
    `;

    values.push(recordId);

    return db.prepare(query).run(...values);
}

function deleteRecordById(recordId) {
    const query = `DELETE FROM records WHERE id = ?`;

    const result = db.prepare(query).run(recordId);

    return result.changes; // rows affected
}

export { createRecord, deleteRecordById, findRecords, getRecordById, updateRecordById };

