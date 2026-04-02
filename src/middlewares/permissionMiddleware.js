import { getRoleById } from "../repository/roleRepo.js";
import { ForbiddenError, UnauthorizedError } from "../utils/apiError.js";

function permissionMiddleware(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return next(new UnauthorizedError("User not authenticated"));
        }
        let userRole;
        try {
            userRole = getRoleById(req.user.role_id);
        } catch (err) {
            return next(new UnauthorizedError("Role not found"));
        }

        if (!allowedRoles.includes(userRole)) {
            return next(
                new ForbiddenError(
                    `Role '${userRole}' not allowed to access this resource`
                )
            );
        }

        next();
    };

}

export { permissionMiddleware };
