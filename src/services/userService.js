import bcrypt from "bcrypt";
import { getRoleById, getRoleIdByName } from "../repository/roleRepo.js";
import { clearAllTables, clearTable, createUser, findByEmail, getAllUsers, getUserById, updateUserById } from "../repository/userRepo.js";
import { ForbiddenError, NotFoundError } from "../utils/apiError.js";
import { ROLES } from "../utils/constants.js";

async function createUserService(email, password) {
    const existingUser = findByEmail(email)

    if (existingUser) {
        throw new ApiError(409, "Email already registered", {
            code: "USER_EXISTS"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const userId = createUser(email, hashedPassword)

    return {
        id: userId,
    }
}

function getUsersService() {
    return getAllUsers()
}

function getUserByIdService(requestingUser, targetUserId) {
    if (
        requestingUser.role !== ROLES.ADMIN &&
        String(requestingUser.id) !== String(targetUserId)
    ) {
        throw new ForbiddenError("Not allowed to view this user");
    }

    const user = getUserById(targetUserId);

    if (!user) {
        throw new NotFoundError("User not found");
    }

    return user;
}

function updateUserService(requestingUser, targetUserId, data) {
    if (requestingUser.role !== ROLES.ADMIN) {
        throw new ForbiddenError("Only admins can update users");
    }

    const existingUser = getUserById(targetUserId);
    if (!existingUser) {
        throw new NotFoundError("User not found");
    }

    let role_id = null;

    if (data.role) {
        const roleId = getRoleIdByName(data.role);
        if (!role) {
            throw new NotFoundError("Role not found");
        }
        role_id = roleId;
    }

    updateUserById(targetUserId, {
        role_id,
        status: data.status
    });

    return getUserById(targetUserId);
}

function clearAllTablesService(user) {
    const userRole = getRoleById(user.role_id)
    if (userRole !== ROLES.ADMIN) {
        throw new ForbiddenError("Only admins can clear database");
    }

    clearAllTables();
}

function clearTableService(user, tableName) {
    const userRole = getRoleById(user.role_id)
    if (userRole !== ROLES.ADMIN) {
        throw new ForbiddenError("Only admins can clear tables");
    }

    clearTable(tableName);
}

export { clearAllTablesService, clearTableService, createUserService, getUserByIdService, getUsersService, updateUserService };

