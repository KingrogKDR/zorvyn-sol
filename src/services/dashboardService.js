import { getCategoryBreakdown, getMonthlyTrends, getRecentRecords, getUserRecordSummary, getWeeklyTrends } from "../repository/dashboardRepo.js";
import { BadRequestError } from "../utils/apiError.js";
import { MAX_LIMIT } from "../utils/constants.js";
import { resolveUserScope, validateSummaryFilters } from "../utils/lib.js";

function getRecordSummaryService(user, filters = {}) {
    const validatedFilters = validateSummaryFilters(filters);
    const targetUserId = resolveUserScope(
        user,
        validatedFilters.user_id
    );

    validatedFilters.user_id = targetUserId;

    const result = getUserRecordSummary(validatedFilters);

    return {
        user_id: validatedFilters.user_id,
        totalIncome: result.income || 0,
        totalExpense: result.expense || 0,
        netBalance: (result.income || 0) - (result.expense || 0)
    };
}


function getCategoryBreakdownService(user, filters = {}) {
    const validatedFilters = validateSummaryFilters(filters);

    const targetUserId = resolveUserScope(
        user,
        validatedFilters.user_id
    );

    validatedFilters.user_id = targetUserId;

    const result = getCategoryBreakdown(validatedFilters);

    return {
        user_id: validatedFilters.user_id,
        categories: result.map(row => ({
            category: row.category,
            totalIncome: row.income || 0,
            totalExpense: row.expense || 0,
            netBalance: (row.income || 0) - (row.expense || 0)
        }))
    };
}

function getRecentRecordsService(user, filters = {}) {

    let limit = filters.limit !== undefined ? Number(filters.limit) : 10;

    if (!Number.isInteger(limit) || limit <= 0) {
        throw new BadRequestError("Invalid limit");
    }

    if (limit > MAX_LIMIT) {
        limit = MAX_LIMIT;
    }

    const targetUserId = resolveUserScope(user, filters.user_id);

    const records = getRecentRecords(targetUserId, limit);

    return {
        user_id: targetUserId,
        count: records.length,
        records
    };
}

function getMonthlyTrendsService(user, filters = {}) {
    const validatedFilters = validateSummaryFilters(filters);

    const targetUserId = resolveUserScope(
        user,
        validatedFilters.user_id
    );

    validatedFilters.user_id = targetUserId;

    const result = getMonthlyTrends(validatedFilters);

    return {
        user_id: targetUserId,
        trends: result.map(row => ({
            month: row.month,
            totalIncome: row.income || 0,
            totalExpense: row.expense || 0,
            netBalance: (row.income || 0) - (row.expense || 0)
        }))
    };
}

function getWeeklyTrendsService(user, filters = {}) {
    const validatedFilters = validateSummaryFilters(filters);

    const targetUserId = resolveUserScope(
        user,
        validatedFilters.user_id
    );

    validatedFilters.user_id = targetUserId;

    const result = getWeeklyTrends(validatedFilters);

    return {
        user_id: targetUserId,
        trends: result.map(row => ({
            week: row.week,
            totalIncome: row.income || 0,
            totalExpense: row.expense || 0,
            netBalance: (row.income || 0) - (row.expense || 0)
        }))
    };
}

export { getCategoryBreakdownService, getMonthlyTrendsService, getRecentRecordsService, getRecordSummaryService, getWeeklyTrendsService };

