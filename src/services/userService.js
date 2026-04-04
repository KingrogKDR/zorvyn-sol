import bcrypt from "bcrypt";
import { deleteUserById, getRoleById, getRoleIdByName } from "../repository/roleRepo.js";
import { clearAllTables, clearTable, createUser, findByEmail, getAllUsers, getUserById, updateUserById } from "../repository/userRepo.js";
import { ApiError, BadRequestError, ForbiddenError, NotFoundError } from "../utils/apiError.js";
import { ROLE_ID, ROLES } from "../utils/constants.js";
import { sanitizeUpdateData, validateUserUpdate } from "../utils/lib.js";

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
        requestingUser.role_id !== ROLE_ID.ADMIN &&
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
    if (requestingUser.role_id !== ROLE_ID.ADMIN) {
        throw new ForbiddenError("Only admins can update users");
    }

    const existingUser = getUserById(targetUserId);
    if (!existingUser) {
        throw new NotFoundError("User not found");
    }

    const sanitizedData = sanitizeUpdateData(data, ["role", "status"]);
    if (Object.keys(sanitizedData).length === 0) {
        throw new BadRequestError("No valid fields provided for user update");
    }

    validateUserUpdate(sanitizedData)

    let role_id = null;

    if (sanitizedData.role) {
        const roleId = getRoleIdByName(sanitizedData.role);
        if (!roleId) {
            throw new NotFoundError("Role not found");
        }
        role_id = roleId;
    }

    updateUserById(targetUserId, {
        role_id,
        status: sanitizedData.status
    });

    return getUserById(targetUserId);
}

function deleteUserService(requestingUser, targetUserId) {
    if (requestingUser.role !== ROLES.ADMIN) {
        throw new ForbiddenError("Only admins can delete users");
    }

    // prevents self-delete
    if (requestingUser.id === Number(targetUserId)) {
        throw new BadRequestError("Admin cannot delete themselves");
    }

    const existingUser = getUserById(targetUserId);

    if (!existingUser) {
        throw new NotFoundError("User not found");
    }

    deleteUserById(targetUserId);
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

export { clearAllTablesService, clearTableService, createUserService, deleteUserService, getUserByIdService, getUsersService, updateUserService };

