const ROLES = {
    VIEWER: "viewer",
    ANALYST: "analyst",
    ADMIN: "admin",
}

const ROLE_ID = {
    VIEWER: 1,
    ANALYST: 2,
    ADMIN: 3
}
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_UPDATE_USER_STATUS = ["active", "inactive", "suspended"];
const ALLOWED_RECORD_TYPES = ["INCOME", "EXPENSE"];

const ALLOWED_TABLES_TO_MODIFY = ["users"]; // validating for avoiding SQL injection

const NULLABLE_FIELDS = ["notes"];

// for pagination
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;


export { ALLOWED_RECORD_TYPES, ALLOWED_TABLES_TO_MODIFY, ALLOWED_UPDATE_USER_STATUS, DEFAULT_LIMIT, emailRegex, MAX_LIMIT, NULLABLE_FIELDS, ROLE_ID, ROLES };

