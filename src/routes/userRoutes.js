import express from "express";
import { clearAllController, clearTableController, createUserController, getAllUsersController, getUserController, updateUserController } from "../controllers/userController.js";
import { permissionMiddleware } from "../middlewares/permissionMiddleware.js";
import { ROLES } from "../utils/constants.js";

const router = express.Router();

router.post("/", permissionMiddleware([ROLES.ADMIN]), createUserController)
router.get("/", permissionMiddleware([ROLES.ADMIN]), getAllUsersController)
router.get("/:id", permissionMiddleware([ROLES.ADMIN, ROLES.ANALYST, ROLES.VIEWER]), getUserController)
router.patch("/:id", permissionMiddleware([ROLES.ADMIN]), updateUserController)
router.delete("/clear-all", permissionMiddleware([ROLES.ADMIN]), clearAllController)
router.delete("/clear/:table", permissionMiddleware([ROLES.ADMIN]), clearTableController)

export default router
