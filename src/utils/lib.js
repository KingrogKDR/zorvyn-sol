import { BadRequestError, ForbiddenError } from "./apiError.js";
import { ALLOWED_RECORD_TYPES, ALLOWED_UPDATE_USER_STATUS, DEFAULT_LIMIT, MAX_LIMIT, NULLABLE_FIELDS, ROLE_ID } from "./constants.js";

function parseDateString(dateStr) {
    if (typeof dateStr !== "string") {
        throw new BadRequestError("Date must be a string");
    }

    const parts = dateStr.split("-");

    if (parts.length !== 3) {
        throw new BadRequestError("Invalid date format. Use dd-mm-yyyy");
    }

    const [day, month, yearStr] = parts;

    if (yearStr.length !== 4) {
        throw new BadRequestError("Year must be 4 digits (yyyy)");
    }

    const dayNum = Number(day);
    const monthNum = Number(month);
    const yearNum = Number(yearStr);

    if (
        !Number.isInteger(dayNum) ||
        !Number.isInteger(monthNum) ||
        !Number.isInteger(yearNum)
    ) {
        throw new BadRequestError("Invalid date values");
    }

    if (monthNum < 1 || monthNum > 12) {
        throw new BadRequestError("Invalid month");
    }

    if (dayNum < 1 || dayNum > 31) {
        throw new BadRequestError("Invalid day");
    }

    const date = new Date(yearNum, monthNum - 1, dayNum);

    // catch invalid combos like 31-02-2026
    if (
        date.getFullYear() !== yearNum ||
        date.getMonth() !== monthNum - 1 ||
        date.getDate() !== dayNum
    ) {
        throw new BadRequestError("Invalid calendar date");
    }


    if (isNaN(date.getTime())) {
        throw new BadRequestError("Invalid date");
    }

    return date.getTime(); // ms timestamp
}

function sanitizeUpdateData(data, allowedFields = []) {
    if (!data || typeof data !== "object") {
        throw new BadRequestError("Invalid payload");
    }

    const sanitized = {};

    for (const key of Object.keys(data)) {
        if (!allowedFields.includes(key)) {
            throw new BadRequestError(`Unknown field: ${key}`);
        }

        if (data[key] !== undefined) {
            sanitized[key] = data[key];
        }
    }

    return sanitized;
}

function validateUserUpdate(data) {
    if (data.status !== undefined) {
        if (!ALLOWED_UPDATE_USER_STATUS.includes(data.status)) {
            throw new BadRequestError(
                `Invalid status. Allowed: ${ALLOWED_UPDATE_USER_STATUS.join(", ")}`
            );
        }
    }

    if (data.role !== undefined) {
        if (typeof data.role !== "string") {
            throw new BadRequestError("Role must be a string");
        }
    }
}

function validateRecordInput(data, { isUpdate = false } = {}) {
    if (!data || typeof data !== "object") {
        throw new BadRequestError("Invalid payload");
    }

    if (!isUpdate) {
        const requiredFields = ["amount", "type", "category", "date"];

        for (const field of requiredFields) {
            if (data[field] === undefined || data[field] === null) {
                throw new BadRequestError(`${field} is required`);
            }
        }
    }

    if (data.amount !== undefined) {
        if (typeof data.amount !== "number" || isNaN(data.amount)) {
            throw new BadRequestError("Amount must be a valid number");
        }

        if (data.amount < 0) {
            throw new BadRequestError("Amount must be >= 0");
        }
    }

    if (data.type !== undefined) {
        if (!ALLOWED_RECORD_TYPES.includes(data.type)) {
            throw new BadRequestError(`Type must be one of: ${ALLOWED_RECORD_TYPES.join(", ")}`
            );
        }
    }

    if (data.category !== undefined) {
        if (typeof data.category !== "string" || data.category.trim() === "") {
            throw new BadRequestError("Category must be a non-empty string");
        }
    }

    if (data.date !== undefined) {
        const parsedDate = parseDateString(data.date);

        // Optional sanity check (avoid absurd values)
        const now = Date.now();
        if (parsedDate > now + 24 * 60 * 60 * 1000) {
            throw new BadRequestError("Date cannot be in the far future");
        }

        data.date = parsedDate;
    }

    if (data.notes !== undefined) {
        if (data.notes !== null && typeof data.notes !== "string") {
            throw new BadRequestError("Notes must be a string or null");
        }

        if (data.notes.length > 1000) {
            throw new BadRequestError("Notes too long");
        }
    }

    return true;
}

function normalizeCategory(category) {
    return category
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " "); // collapse multiple spaces
}

function validateRecordFilters(query) {
    const sanitized = {};

    if (query.type !== undefined) {
        if (!ALLOWED_RECORD_TYPES.includes(query.type)) {
            throw new BadRequestError("Invalid type filter");
        }
        sanitized.type = query.type;
    }

    if (query.category !== undefined) {
        if (typeof query.category !== "string") {
            throw new BadRequestError("Invalid category filter");
        }

        sanitized.category = query.category.trim().toLowerCase();
    }

    if (query.startDate !== undefined) {
        sanitized.startDate = parseDateString(query.startDate);
    }

    if (query.endDate !== undefined) {
        sanitized.endDate = parseDateString(query.endDate, { endOfDay: true });
    }

    if (sanitized.startDate !== undefined && sanitized.endDate !== undefined && sanitized.startDate > sanitized.endDate) {
        throw new BadRequestError("startDate cannot be greater than endDate");
    }

    // Pagination

    let limit = query.limit !== undefined ? Number(query.limit) : DEFAULT_LIMIT;
    let page = query.page !== undefined ? Number(query.page) : 1;

    if (!Number.isInteger(limit) || limit <= 0) {
        throw new BadRequestError("Invalid limit");
    }

    if (!Number.isInteger(page) || page <= 0) {
        throw new BadRequestError("Invalid page");
    }

    if (limit > MAX_LIMIT) {
        limit = MAX_LIMIT;
    }

    const offset = (page - 1) * limit;

    sanitized.limit = limit;
    sanitized.offset = offset;
    sanitized.page = page;

    return sanitized;
}

function validateRecordUpdateNullability(data) {
    for (const key of Object.keys(data)) {
        if (data[key] === null) {
            if (!NULLABLE_FIELDS.includes(key)) {
                throw new BadRequestError(`${key} cannot be null`);
            }
        }
    }
}

function validateSummaryFilters(query = {}) {
    const sanitized = {};

    if (query.startDate !== undefined) {
        sanitized.startDate = parseDateString(query.startDate);
    }

    if (query.endDate !== undefined) {
        sanitized.endDate = parseDateString(query.endDate, { endOfDay: true });
    }

    if (
        sanitized.startDate !== undefined &&
        sanitized.endDate !== undefined &&
        sanitized.startDate > sanitized.endDate
    ) {
        throw new BadRequestError("startDate cannot be greater than endDate");
    }

    // allow admin override
    if (query.user_id !== undefined) {
        const userId = Number(query.user_id);
        if (!Number.isInteger(userId)) {
            throw new BadRequestError("Invalid user_id");
        }
        sanitized.user_id = userId;
    }

    return sanitized;
}

function resolveUserScope(user, requestedUserId) {
    const isPrivileged =
        user.role_id === ROLE_ID.ADMIN ||
        user.role_id === ROLE_ID.ANALYST;

    if (requestedUserId !== undefined) {
        const id = Number(requestedUserId);

        if (!Number.isInteger(id)) {
            throw new BadRequestError("Invalid user_id");
        }

        if (!isPrivileged && id !== user.id) {
            throw new ForbiddenError("Access denied");
        }

        return id;
    }

    return user.id;
}

export { normalizeCategory, parseDateString, resolveUserScope, sanitizeUpdateData, validateRecordFilters, validateRecordInput, validateRecordUpdateNullability, validateSummaryFilters, validateUserUpdate };

