import logger from "./logger.js";

class ApiError extends Error {
    constructor(
        statusCode,
        message,
        options = {}
    ) {
        super(message);

        this.statusCode = statusCode;
        this.status = String(statusCode).startsWith("4") ? "fail" : "error";

        this.isOperational = true;

        // Optional metadata
        this.code = options.code || null;        // e.g. DB_INIT_FAILED
        this.details = options.details || null; // raw error or extra info

        Error.captureStackTrace(this, this.constructor);
    }
}

class BadRequestError extends ApiError {
    constructor(message = "Bad client request") {
        super(400, message)
    }
}

class NotFoundError extends ApiError {
    constructor(message = "Resource not found") {
        super(404, message);
    }
}

class UnauthorizedError extends ApiError {
    constructor(message = "Unauthorized") {
        super(401, message);
    }
}

class ForbiddenError extends ApiError {
    constructor(message = "Forbidden") {
        super(403, message);
    }
}

function globalErrorHandler(err, req, res, next) {
    logger.error({
        statusCode: err.statusCode,
        message: err.message,
        path: req.originalUrl,
        method: req.method,
        userId: req.user?.id || null
    });

    if (!(err instanceof ApiError)) {
        err = new ApiError(500, "Internal Server Error", {
            code: "UNEXPECTED_ERROR",
            details: err.message
        });
    }
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            code: err.code || null
        });
    }

    res.status(500).json({
        status: "Server Error",
        message: "Something went wrong"
    });
}

function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

export { ApiError, asyncHandler, BadRequestError, ForbiddenError, globalErrorHandler, NotFoundError, UnauthorizedError };

