import express from "express";
import { createRecordController, deleteRecordController, getAllRecordsController, getRecordController, updateRecordController } from "../controllers/recordController.js";
import { permissionMiddleware } from "../middlewares/permissionMiddleware.js";
import { ROLES } from "../utils/constants.js";

const router = express.Router();

router.post("/", permissionMiddleware([ROLES.ADMIN, ROLES.VIEWER]), createRecordController)
router.get("/", permissionMiddleware([ROLES.ADMIN, ROLES.ANALYST, ROLES.VIEWER]), getAllRecordsController)
router.get("/:id", permissionMiddleware([ROLES.ADMIN, ROLES.ANALYST, ROLES.VIEWER]), getRecordController)
router.patch("/:id", permissionMiddleware([ROLES.ADMIN, ROLES.VIEWER]), updateRecordController)
router.delete("/:id", permissionMiddleware([ROLES.ADMIN, ROLES.VIEWER]), deleteRecordController)

export default router
