import request from "supertest";
import app from "../src/app.js";
import { TokenBucket } from "../src/ratelimiter/tokenBucket.js";

jest.mock("../src/middlewares/authMiddleware.js", () => ({
    authMiddleware: (req, res, next) => {
        req.user = { id: "test-user" };
        next();
    }
}));

describe("API Rate Limiting", () => {
    test("should block after limit", async () => {
        let lastResponse;

        for (let i = 0; i < 12; i++) {
            lastResponse = await request(app)
                .get("/users")
                .set("Authorization", "Bearer test-token");
        }

        expect(lastResponse.status).toBe(429);
    });
});

describe("TokenBucket", () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: Date.now() });
        jest.setSystemTime(new Date("2026-01-01T00:00:00Z").getTime());
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("allows requests up to capacity", () => {
        const bucket = new TokenBucket(3, 1);

        expect(bucket.allowRequest()).toBe(true);
        expect(bucket.allowRequest()).toBe(true);
        expect(bucket.allowRequest()).toBe(true);

        // exhausted
        expect(bucket.allowRequest()).toBe(false);
    });

    test("refills tokens over time", () => {
        const bucket = new TokenBucket(2, 1); // 1 token/sec

        // consume all
        bucket.allowRequest();
        bucket.allowRequest();
        expect(bucket.allowRequest()).toBe(false);

        // move time forward by 1 second
        jest.advanceTimersByTime(1000);

        expect(bucket.allowRequest()).toBe(true);
    });

    test("does not exceed capacity on refill", () => {
        const bucket = new TokenBucket(2, 10);

        // advance time heavily
        jest.advanceTimersByTime(5000);

        bucket.refill();

        expect(bucket.tokens).toBe(2); // capped at capacity
    });

    test("partial refill works correctly", () => {
        const bucket = new TokenBucket(2, 2); // 2 tokens/sec

        bucket.allowRequest(); // now 1 token left

        // advance 500ms → should refill 1 token
        jest.advanceTimersByTime(500);

        bucket.refill();

        expect(bucket.tokens).toBeCloseTo(2); // back to full
    });
});