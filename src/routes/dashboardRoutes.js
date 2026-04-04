import express from "express";
import { getCategoryBreakdownController, getMonthlyTrendsController, getRecentRecordsController, getRecordSummaryController, getWeeklyTrendsController } from "../controllers/dashboardController.js";
import { permissionMiddleware } from "../middlewares/permissionMiddleware.js";
import { ROLES } from "../utils/constants.js";

const router = express.Router();

router.get(
    "/summary",
    permissionMiddleware([ROLES.ADMIN, ROLES.ANALYST, ROLES.VIEWER]), getRecordSummaryController
)
router.get(
    "/categories",
    permissionMiddleware([ROLES.ADMIN, ROLES.ANALYST, ROLES.VIEWER]), getCategoryBreakdownController
)
router.get(
    "/recent",
    permissionMiddleware([ROLES.ADMIN, ROLES.ANALYST, ROLES.VIEWER]),
    getRecentRecordsController
);
router.get(
    "/monthly-trends",
    permissionMiddleware([ROLES.ADMIN, ROLES.ANALYST, ROLES.VIEWER]),
    getMonthlyTrendsController
)
router.get(
    "/weekly-trends",
    permissionMiddleware([ROLES.ADMIN, ROLES.ANALYST, ROLES.VIEWER]),
    getWeeklyTrendsController
)


export default router
