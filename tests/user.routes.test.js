import cookieParser from "cookie-parser";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";

import { authMiddleware } from "../src/middlewares/authMiddleware.js";
import userRouter from "../src/routes/userRoutes.js";
import { asyncHandler, ForbiddenError, globalErrorHandler } from "../src/utils/apiError.js";

// mock services
import * as userService from "../src/services/userService.js";
jest.mock("../src/services/userService.js");

// mock repositories
import { getRoleById } from "../src/repository/roleRepo.js";
import { findById } from "../src/repository/userRepo.js";
import { ROLES } from "../src/utils/constants.js";

jest.mock("../src/repository/userRepo.js");

jest.mock("../src/repository/roleRepo.js");

const JWT_SECRET = "testsecret";

function generateToken(user) {
    return jwt.sign(user, JWT_SECRET);
}

function createTestApp() {
    const app = express();

    app.use(express.json());
    app.use(cookieParser());

    app.use("/users", asyncHandler(authMiddleware), userRouter);

    app.use(globalErrorHandler);

    return app;
}

beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
});

test("GET /users - admin should succeed", async () => {
    const app = createTestApp();

    findById.mockReturnValue({
        id: "1",
        status: "active",
        role_id: 3
    });

    getRoleById.mockReturnValue(ROLES.ADMIN)

    userService.getUsersService.mockReturnValue([
        { id: "1", email: "a@test.com", role_id: 3 }
    ]);

    const token = generateToken({ user_id: "1" });

    const res = await request(app)
        .get("/users")
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
});

test("GET /users - non-admin should fail", async () => {
    const app = createTestApp();

    findById.mockReturnValue({
        id: "2",
        status: "active",
        role_id: 1
    });

    getRoleById.mockReturnValue(ROLES.VIEWER)

    const token = generateToken({ user_id: "2" });

    const res = await request(app)
        .get("/users")
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(403);
});

test("GET /users/:id - self access", async () => {
    const app = createTestApp();

    findById.mockReturnValue({
        id: "1",
        status: "active",
        role_id: 1
    });

    getRoleById.mockReturnValue(ROLES.VIEWER)

    userService.getUserByIdService.mockReturnValue({
        id: "1",
        email: "self@test.com",
        role_id: 1
    });

    const token = generateToken({ user_id: "1" });

    const res = await request(app)
        .get("/users/1")
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(200);
});

test("GET /users/:id - non-admin accessing other user", async () => {
    const app = createTestApp();

    findById.mockReturnValue({
        id: "2",
        status: "active",
        role_id: 1
    });

    getRoleById.mockReturnValue(ROLES.VIEWER)

    userService.getUserByIdService.mockImplementation(() => {
        throw new ForbiddenError("Not allowed");
    });

    const token = generateToken({ user_id: "2" });

    const res = await request(app)
        .get("/users/1")
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(403);
});

test("PATCH /users/:id - admin updates user", async () => {
    const app = createTestApp();

    findById.mockReturnValue({
        id: "1",
        status: "active",
        role_id: 3
    });

    getRoleById.mockReturnValue(ROLES.ADMIN)

    userService.updateUserService.mockReturnValue({
        id: "2",
        role_id: 3
    });

    const token = generateToken({ user_id: "1" });

    const res = await request(app)
        .patch("/users/2")
        .send({ role: "admin" })
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(200);
});

test("PATCH /users/:id - non-admin should fail", async () => {
    const app = createTestApp();

    findById.mockReturnValue({
        id: "2",
        status: "active",
        role_id: 2
    });

    getRoleById.mockReturnValue(ROLES.ANALYST)

    const token = generateToken({ user_id: "2" });

    const res = await request(app)
        .patch("/users/2")
        .send({ role: "admin" })
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(403);
});

test("DELETE /users/clear-all - admin", async () => {
    const app = createTestApp();

    findById.mockReturnValue({
        id: "1",
        status: "active",
        role_id: 3
    });

    getRoleById.mockReturnValue(ROLES.ADMIN)

    const token = generateToken({ user_id: "1" });

    const res = await request(app)
        .delete("/users/clear-all")
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(200);
});