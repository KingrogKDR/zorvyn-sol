import cookieParser from "cookie-parser";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { authMiddleware } from "../src/middlewares/authMiddleware.js";
import { findById } from "../src/repository/userRepo.js";
import { asyncHandler, globalErrorHandler } from "../src/utils/apiError.js";

jest.mock("../src/repository/userRepo.js");

const JWT_SECRET = "testsecret";

function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET);
}

beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
});

function createTestApp() {
    const app = express();

    app.use(express.json());
    app.use(cookieParser());

    // dummy protected route
    app.post("/protected", asyncHandler(authMiddleware), (req, res) => {
        res.status(200).json({
            message: "Access granted",
            user: req.user
        });
    });

    app.use(globalErrorHandler);

    return app;
}

test("should return 401 if no token provided", async () => {
    const app = createTestApp();

    const res = await request(app).post("/protected");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Token missing");
});

test("should return 401 for invalid token", async () => {
    const app = createTestApp();

    const res = await request(app)
        .post("/protected")
        .set("Cookie", ["token=invalidtoken"]);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid token");
});

test("should return 401 if user is inactive", async () => {
    const app = createTestApp();

    const token = generateToken({ user_id: "123" });

    // mock DB response
    findById.mockReturnValue({
        id: "123",
        status: "inactive",
        role_id: 1
    });

    const res = await request(app)
        .post("/protected")
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("User inactive");
});

test("should allow access for valid token and active user", async () => {
    const app = createTestApp();

    const token = generateToken({ user_id: "123" });

    findById.mockReturnValue({
        id: "123",
        status: "active",
        role_id: 1
    });

    const res = await request(app)
        .post("/protected")
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Access granted");
    expect(res.body.user.id).toBe("123");
});

test("should return 401 if token is expired", async () => {
    const app = createTestApp();

    const token = jwt.sign(
        { user_id: "123" },
        process.env.JWT_SECRET,
        { expiresIn: "1ms" } // expires almost immediately
    );

    // wait so token actually expires
    await new Promise((resolve) => setTimeout(resolve, 10));

    const res = await request(app)
        .post("/protected")
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Token expired");
});
