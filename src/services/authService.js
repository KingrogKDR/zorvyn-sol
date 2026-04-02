import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, findByEmail, findById } from "../repository/userRepo.js";
import { ApiError } from "../utils/apiError.js";

async function loginService(email, password) {
    const user = findByEmail(email)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new ApiError(401, "Invalid user credentials")

    if (user.status !== "active") {
        throw new ApiError(400, "User inactive");
    }
    const token = jwt.sign(
        {
            user_id: user.id,
            role_id: user.role_id,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    )

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            role_id: user.role_id,
            status: user.status
        }
    };

}

async function signupService(email, password) {

    const existingUser = findByEmail(email)

    if (existingUser) {
        throw new ApiError(409, "Email already registered", {
            code: "EMAIL_EXISTS"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const userId = createUser(email, hashedPassword)

    const user = findById(userId)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const token = jwt.sign(
        {
            user_id: user.id,
            role_id: user.role_id,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    )

    return {
        token,
        user: {
            id: user.id,
            role_id: user.role_id,
            status: user.status
        }
    }
}

export { loginService, signupService };
