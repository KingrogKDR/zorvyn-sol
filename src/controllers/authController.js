import { loginService, signupService } from "../services/authService.js";
import { asyncHandler } from "../utils/apiError.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loginController = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body
    if (!email || !password) {
        return next(new ApiError(400, "Email and password required"));
    }
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format");
    }
    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters");
    }

    const { token, user } = await loginService(email, password)
    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 1000,
    })
    res.status(200).json({
        status: "success",
        user
    })
})

const signupController = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body
    if (!email || !password) {
        return next(new ApiError(400, "Email and password required"));
    }
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format");
    }
    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters");
    }
    const { token, user } = await signupService(email, password)
    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 1000,
    })
    res.status(201).json({
        status: "success",
        user,
        message: "User successfully created"
    })
})


const logoutController = asyncHandler(async (req, res) => {
    res.clearCookie("token");

    res.status(200).json({
        status: "success",
        message: "Logged out successfully"
    });
});


export { loginController, logoutController, signupController };

