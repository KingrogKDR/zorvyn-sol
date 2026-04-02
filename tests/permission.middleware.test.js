import { permissionMiddleware } from "../src/middlewares/permissionMiddleware.js";
import { getRoleById } from "../src/repository/roleRepo.js";
import { ForbiddenError, UnauthorizedError } from "../src/utils/apiError.js";

jest.mock("../src/repository/roleRepo.js");

function mockReq(user = null) {
    return { user };
}

function mockRes() {
    return {};
}

function mockNext() {
    return jest.fn();
}

test("should return 401 if req.user is missing", () => {
    const req = mockReq(null);
    const res = mockRes();
    const next = mockNext();

    const middleware = permissionMiddleware(["admin"]);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
});

test("should return 403 if role is not allowed", () => {
    getRoleById.mockReturnValue("user");

    const req = mockReq({ role_id: 2 });
    const res = mockRes();
    const next = mockNext();

    const middleware = permissionMiddleware(["admin"]);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
});

test("should call next() if role is allowed", () => {
    getRoleById.mockReturnValue("admin");

    const req = mockReq({ role_id: 1 });
    const res = mockRes();
    const next = mockNext();

    const middleware = permissionMiddleware(["admin"]);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(); // no error
});

test("should return 403 if role is undefined", () => {
    getRoleById.mockReturnValue(undefined);

    const req = mockReq({ role_id: 99 });
    const res = mockRes();
    const next = mockNext();

    const middleware = permissionMiddleware(["admin"]);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
});