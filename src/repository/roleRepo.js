import db from "../db/connection.js";

function getRoleIdByName(roleName) {
    const row = db.prepare(
        `SELECT id FROM role WHERE role_name = ?`
    ).get(roleName);

    if (!row) {
        throw new NotFoundError(`Role '${roleName}' not found`, {
            code: "ROLE_NOT_FOUND",
            details: { roleName }
        });
    }

    return row.id;
}

function getRoleById(roleId) {
    const row = db.prepare(
        `SELECT role_name FROM role WHERE id = ?`
    ).get(roleId);

    if (!row) {
        throw new NotFoundError(`Role '${roleId}' not found`);
    }

    return row.role_name;
}

export { getRoleById, getRoleIdByName };

