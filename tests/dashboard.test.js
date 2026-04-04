import cookieParser from "cookie-parser";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";

import { authMiddleware } from "../src/middlewares/authMiddleware.js";
import { rateLimiter } from "../src/middlewares/rateLimiter.js";
import dashboardRouter from "../src/routes/dashboardRoutes.js";
import { globalErrorHandler } from "../src/utils/apiError.js";

import { getRoleById } from "../src/repository/roleRepo.js";
import { findById } from "../src/repository/userRepo.js";
import * as dashboardService from "../src/services/dashboardService.js";
import { ROLES } from "../src/utils/constants.js";

jest.mock("../src/services/dashboardService.js");
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

    app.use(
        "/dashboard",
        authMiddleware,
        rateLimiter({ type: "user" }),
        dashboardRouter
    );

    app.use(globalErrorHandler);

    return app;
}

beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
});

beforeEach(() => {
    jest.clearAllMocks();
});


test("GET /dashboard/summary - allowed user", async () => {
    const app = createTestApp();

    findById.mockReturnValue({ id: "1", role_id: 1, status: "active" });
    getRoleById.mockReturnValue(ROLES.VIEWER);

    dashboardService.getRecordSummaryService.mockReturnValue({ total: 100 });

    const token = generateToken({ user_id: "1" });

    const res = await request(app)
        .get("/dashboard/summary")
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(200);
});


test("GET /dashboard/categories - analyst allowed", async () => {
    const app = createTestApp();

    findById.mockReturnValue({ id: "2", role_id: 2, status: "active" });
    getRoleById.mockReturnValue(ROLES.ANALYST);

    dashboardService.getCategoryBreakdownService.mockReturnValue([]);

    const token = generateToken({ user_id: "2" });

    const res = await request(app)
        .get("/dashboard/categories")
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(200);
});


test("GET /dashboard/summary - unauthorized role", async () => {
    const app = createTestApp();

    findById.mockReturnValue({ id: "3", role_id: 4, status: "active" });
    getRoleById.mockReturnValue("GUEST");

    const token = generateToken({ user_id: "3" });

    const res = await request(app)
        .get("/dashboard/summary")
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(403);
});


test("GET /dashboard/summary - rate limit exceeded", async () => {
    const app = createTestApp();

    findById.mockReturnValue({ id: "1", role_id: 1, status: "active" });
    getRoleById.mockReturnValue(ROLES.VIEWER);

    dashboardService.getRecordSummaryService.mockReturnValue({});

    const token = generateToken({ user_id: "1" });

    let res;

    // exceed limiter (default: 10 capacity)
    for (let i = 0; i < 15; i++) {
        res = await request(app)
            .get("/dashboard/summary")
            .set("Cookie", [`token=${token}`]);
    }

    expect(res.statusCode).toBe(429);
});


test("GET /dashboard/summary - works after refill", async () => {
    const app = createTestApp();

    findById.mockReturnValue({ id: "1", role_id: 1, status: "active" });
    getRoleById.mockReturnValue(ROLES.VIEWER);

    dashboardService.getRecordSummaryService.mockReturnValue({});

    const token = generateToken({ user_id: "1" });

    // exhaust
    for (let i = 0; i < 10; i++) {
        await request(app)
            .get("/dashboard/summary")
            .set("Cookie", [`token=${token}`]);
    }

    // next should fail
    let res = await request(app)
        .get("/dashboard/summary")
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(429);

    // wait for refill (depends on your config)
    await new Promise(r => setTimeout(r, 1000));

    res = await request(app)
        .get("/dashboard/summary")
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(200);
});