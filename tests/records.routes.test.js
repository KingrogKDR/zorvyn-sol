import cookieParser from "cookie-parser";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";

import { authMiddleware } from "../src/middlewares/authMiddleware.js";
import recordRouter from "../src/routes/recordRoutes.js";
import { globalErrorHandler } from "../src/utils/apiError.js";

import { rateLimiter } from "../src/middlewares/rateLimiter.js";
import { getRoleById } from "../src/repository/roleRepo.js";
import { findById } from "../src/repository/userRepo.js";
import * as recordService from "../src/services/recordService.js";
import { ROLES } from "../src/utils/constants.js";

jest.mock("../src/services/recordService.js");
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

    app.use("/records", authMiddleware, rateLimiter({ type: "user" }), recordRouter);
    app.use(globalErrorHandler);

    return app;
}

beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
});

beforeEach(() => {
    jest.clearAllMocks();
});


test("POST /records - viewer can create", async () => {
    const app = createTestApp();

    findById.mockReturnValue({ id: "1", role_id: 1, status: "active" });
    getRoleById.mockReturnValue(ROLES.VIEWER);

    recordService.createRecordService.mockReturnValue({ id: "10" });

    const token = generateToken({ user_id: "1" });

    const res = await request(app)
        .post("/records")
        .send({ amount: 100, type: "expense", category: "food", date: "2026-01-01" })
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(201);
});


test("GET /records - analyst can view", async () => {
    const app = createTestApp();

    findById.mockReturnValue({ id: "2", role_id: 2, status: "active" });
    getRoleById.mockReturnValue(ROLES.ANALYST);

    recordService.getRecordsService.mockReturnValue([{ id: "1" }]);

    const token = generateToken({ user_id: "2" });

    const res = await request(app)
        .get("/records")
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
});


test("GET /records/:id - viewer can access", async () => {
    const app = createTestApp();

    findById.mockReturnValue({ id: "1", role_id: 1, status: "active" });
    getRoleById.mockReturnValue(ROLES.VIEWER);

    recordService.getRecordByIdService.mockReturnValue({ id: "5" });

    const token = generateToken({ user_id: "1" });

    const res = await request(app)
        .get("/records/5")
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(200);
});


test("PATCH /records/:id - viewer can update", async () => {
    const app = createTestApp();

    findById.mockReturnValue({ id: "1", role_id: 1, status: "active" });
    getRoleById.mockReturnValue(ROLES.VIEWER);

    recordService.updateRecordService.mockReturnValue({ id: "5" });

    const token = generateToken({ user_id: "1" });

    const res = await request(app)
        .patch("/records/5")
        .send({ amount: 200 })
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(200);
});


test("DELETE /records/:id - viewer can delete", async () => {
    const app = createTestApp();

    findById.mockReturnValue({ id: "1", role_id: 1, status: "active" });
    getRoleById.mockReturnValue(ROLES.VIEWER);

    recordService.deleteRecordService.mockImplementation(() => { });

    const token = generateToken({ user_id: "1" });

    const res = await request(app)
        .delete("/records/5")
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(200);
});


test("POST /records - unauthorized role should fail", async () => {
    const app = createTestApp();

    findById.mockReturnValue({ id: "3", role_id: 4, status: "active" });
    getRoleById.mockReturnValue("GUEST"); // not allowed

    const token = generateToken({ user_id: "3" });

    const res = await request(app)
        .post("/records")
        .send({})
        .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(403);
});