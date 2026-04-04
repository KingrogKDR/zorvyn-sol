import { getCategoryBreakdownService, getMonthlyTrendsService, getRecentRecordsService, getRecordSummaryService, getWeeklyTrendsService } from "../services/dashboardService.js";
import { asyncHandler } from "../utils/apiError.js";

const getRecordSummaryController = asyncHandler(async (req, res) => {
    const recordSummary = getRecordSummaryService(req.user, req.query)

    res.json({
        status: "success",
        recordSummary
    })
})

const getCategoryBreakdownController = asyncHandler(async (req, res) => {
    const data = getCategoryBreakdownService(req.user, req.query);

    res.json({
        status: "success",
        data
    });
});

const getRecentRecordsController = asyncHandler(async (req, res) => {
    const data = getRecentRecordsService(req.user, req.query);

    res.json({
        status: "success",
        data
    });
});

const getMonthlyTrendsController = asyncHandler(async (req, res) => {
    const data = getMonthlyTrendsService(req.user, req.query);

    res.json({
        status: "success",
        data
    });
});

const getWeeklyTrendsController = asyncHandler(async (req, res) => {
    const data = getWeeklyTrendsService(req.user, req.query);

    res.json({
        status: "success",
        data
    });
});

export { getCategoryBreakdownController, getMonthlyTrendsController, getRecentRecordsController, getRecordSummaryController, getWeeklyTrendsController };

