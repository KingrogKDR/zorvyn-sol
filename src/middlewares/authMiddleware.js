import jwt from "jsonwebtoken";
import { findById } from "../repository/userRepo.js";
import { UnauthorizedError } from "../utils/apiError.js";

async function authMiddleware(req, res, next) {
    try {
        const token = req.cookies.token;

        if (!token) {
            throw new UnauthorizedError("Token missing");
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);

        const user = findById(payload.user_id);

        if (!user) {
            throw new UnauthorizedError("User not found");
        }

        if (user.status !== "active") {
            throw new UnauthorizedError("User inactive");
        }

        req.user = user;

        next();
    } catch (err) {
        if (err.name === "JsonWebTokenError") {
            return next(new UnauthorizedError("Invalid token"));
        }

        if (err.name === "TokenExpiredError") {
            return next(new UnauthorizedError("Token expired"));
        }

        next(err);
    }
}

export { authMiddleware };
