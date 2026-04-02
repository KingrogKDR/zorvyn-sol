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
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            code: err.code || null
        });
    }

    console.error("Unexpected Error:", err);

    res.status(500).json({
        status: "error",
        message: "Something went wrong"
    });
}

function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

export { ApiError, asyncHandler, ForbiddenError, globalErrorHandler, NotFoundError, UnauthorizedError };

