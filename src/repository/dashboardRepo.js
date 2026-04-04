import db from "../db/connection.js";

function getUserRecordSummary(filters) {
    let query = `
        SELECT
            SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
        FROM records
        WHERE 1=1
    `;

    const values = [];

    if (filters.user_id !== undefined) {
        query += ` AND user_id = ?`;
        values.push(filters.user_id);
    }

    if (filters.startDate && filters.endDate) {
        query += ` AND date BETWEEN ? AND ?`;
        values.push(filters.startDate, filters.endDate);
    } else if (filters.startDate) {
        query += ` AND date >= ?`;
        values.push(filters.startDate);
    } else if (filters.endDate) {
        query += ` AND date <= ?`;
        values.push(filters.endDate);
    }

    return db.prepare(query).get(...values);
}

function getCategoryBreakdown(filters) {
    let query = `
        SELECT category,
            SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
        FROM records
        WHERE 1=1
    `;

    const values = [];

    if (filters.user_id !== undefined) {
        query += ` AND user_id = ?`;
        values.push(filters.user_id);
    }

    if (filters.startDate && filters.endDate) {
        query += ` AND date BETWEEN ? AND ?`;
        values.push(filters.startDate, filters.endDate);
    } else if (filters.startDate) {
        query += ` AND date >= ?`;
        values.push(filters.startDate);
    } else if (filters.endDate) {
        query += ` AND date <= ?`;
        values.push(filters.endDate);
    }

    query += ` GROUP BY category ORDER BY (income + expense) DESC`;

    return db.prepare(query).all(...values);
}

function getRecentRecords(userId, limit = 10) {
    const query = `
        SELECT *
        FROM records
        WHERE user_id = ?
        ORDER BY date DESC
        LIMIT ?
    `;

    return db.prepare(query).all(userId, limit);
}

function getMonthlyTrends(filters) {
    let query = `
        SELECT
            strftime('%Y-%m', date/1000, 'unixepoch') as month,
            SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
        FROM records
        WHERE 1=1
    `;

    const values = [];

    if (filters.user_id !== undefined) {
        query += ` AND user_id = ?`;
        values.push(filters.user_id);
    }

    if (filters.startDate && filters.endDate) {
        query += ` AND date BETWEEN ? AND ?`;
        values.push(filters.startDate, filters.endDate);
    } else if (filters.startDate) {
        query += ` AND date >= ?`;
        values.push(filters.startDate);
    } else if (filters.endDate) {
        query += ` AND date <= ?`;
        values.push(filters.endDate);
    }

    query += ` GROUP BY month ORDER BY month ASC`;

    return db.prepare(query).all(...values);
}

function getWeeklyTrends(filters) {
    let query = `
        SELECT
            strftime('%Y-%W', date/1000, 'unixepoch') as week,
            SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
        FROM records
        WHERE 1=1
    `;
    const values = [];

    if (filters.user_id !== undefined) {
        query += ` AND user_id = ?`;
        values.push(filters.user_id);
    }

    if (filters.startDate && filters.endDate) {
        query += ` AND date BETWEEN ? AND ?`;
        values.push(filters.startDate, filters.endDate);
    } else if (filters.startDate) {
        query += ` AND date >= ?`;
        values.push(filters.startDate);
    } else if (filters.endDate) {
        query += ` AND date <= ?`;
        values.push(filters.endDate);
    }

    query += ` GROUP BY week ORDER BY week ASC`;

    return db.prepare(query).all(...values);

}

export { getCategoryBreakdown, getMonthlyTrends, getRecentRecords, getUserRecordSummary, getWeeklyTrends };

