import jwt from "jsonwebtoken";
import { findById } from "../repository/userRepo.js";
import { asyncHandler, UnauthorizedError } from "../utils/apiError.js";

const getTokenFromRequest = (req) => {
    let token = null;

    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    else if (req.headers.authorization) {
        const authHeader = req.headers.authorization;

        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }
    }

    return token;
};

const authMiddleware = asyncHandler(async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);

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
})

export { authMiddleware };
