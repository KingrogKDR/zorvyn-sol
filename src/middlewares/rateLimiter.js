import { getUserBucket } from "../ratelimiter/tokenBucket.js";
import { ApiError } from "../utils/apiError.js";

const rateLimiter = (options) => {
    return (req, _, next) => {
        let key;

        if (options.type === "user") {
            key = req.user.id;
        } else if (options.type === "ip") {
            key = req.ip;
        }

        if (!key) {
            throw new ApiError(500, "Rate limiter key missing");
        }

        const bucket = getUserBucket(key);

        if (!bucket.allowRequest()) {
            throw new ApiError(429, "Too Many Requests")
        }

        next();
    }
}

export { rateLimiter };
