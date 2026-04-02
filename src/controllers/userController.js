import { clearAllTablesService, clearTableService, createUserService, getUserByIdService, getUsersService, updateUserService } from "../services/userService.js";
import { asyncHandler } from "../utils/apiError.js";

const createUserController = asyncHandler(async (req, res, next) => {
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
    const data = await createUserService(email, password)
    res.status(201).json({
        status: "success",
        data,
        message: "User successfully created"
    })
})

const getAllUsersController = (req, res, next) => {
    const users = getUsersService()

    res.status(200).json({
        status: "success",
        results: users.length,
        data: users
    })
}

const getUserController = (req, res) => {
    const user = getUserByIdService(req.user, req.params.id);

    res.status(200).json({
        status: "success",
        data: user
    });
};

const updateUserController = asyncHandler(async (req, res) => {
    const updatedUser = updateUserService(
        req.user,
        req.params.id,
        req.body
    );

    res.status(200).json({
        status: "success",
        data: updatedUser
    });
});

const clearAllController = (req, res) => {
    clearAllTablesService(req.user);

    res.status(200).json({
        status: "success",
        message: "All tables cleared"
    });
};

const clearTableController = (req, res) => {
    const { table } = req.params;

    clearTableService(req.user, table);

    res.status(200).json({
        status: "success",
        message: `Table '${table}' cleared`
    });
};

export { clearAllController, clearTableController, createUserController, getAllUsersController, getUserController, updateUserController };

