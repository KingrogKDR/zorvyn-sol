import { createRecord, deleteRecordById, findRecords, getRecordById, updateRecordById } from "../repository/recordRepo.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/apiError.js";
import { ROLE_ID } from "../utils/constants.js";
import { normalizeCategory, sanitizeUpdateData, validateRecordFilters, validateRecordInput, validateRecordUpdateNullability } from "../utils/lib.js";

function createRecordService(userId, data) {
    validateRecordInput(data);

    const record = {
        user_id: userId,
        amount: data.amount,
        type: data.type,
        category: normalizeCategory(data.category),
        date: data.date,
        notes: data.notes ?? null,
        created_at: Date.now(),
    };

    const id = createRecord(record);
    return getRecordById(id);
}

function getRecordsService(user, filters) {
    const validatedFilters = validateRecordFilters(filters);
    const isPrivileged =
        user.role_id === ROLE_ID.ADMIN ||
        user.role_id === ROLE_ID.ANALYST;

    if (!isPrivileged) {
        validatedFilters.user_id = user.id;
    }

    return findRecords(validatedFilters);
}

function getRecordByIdService(requestingUser, targetRecordId) {
    const record = getRecordById(targetRecordId);

    if (!record) {
        throw new NotFoundError("Record not found");
    }
    const isAdmin = requestingUser.role_id === ROLE_ID.ADMIN || requestingUser.role_id === ROLE_ID.ANALYST

    const isOwner = requestingUser.id === record.user_id
    if (!isAdmin && !isOwner) {
        throw new ForbiddenError("Not allowed to view this user");
    }

    return record;
}

function updateRecordService(requestingUser, targetRecordId, data) {

    const existingRecord = getRecordById(targetRecordId);
    if (!existingRecord) {
        throw new NotFoundError("Record not found");
    }

    const isAdmin = requestingUser.role_id === ROLE_ID.ADMIN;
    const isOwner = String(existingRecord.user_id) === String(requestingUser.id);

    if (!isAdmin && !isOwner) {
        throw new ForbiddenError("Not allowed to update this record");
    }

    const sanitizedData = sanitizeUpdateData(data, ["amount", "type", "category", "date", "notes"]);
    if (Object.keys(sanitizedData).length === 0) {
        throw new BadRequestError("No valid fields provided for record update");
    }

    validateRecordUpdateNullability(sanitizedData);

    validateRecordInput(sanitizedData, { isUpdate: true })

    if (sanitizedData.category) {
        sanitizedData.category = normalizeCategory(sanitizedData.category);
    }

    sanitizedData.updated_at = Date.now();

    updateRecordById(targetRecordId, sanitizedData);

    return getRecordById(targetRecordId);

}

function deleteRecordService(requestingUser, recordId) {
    const record = getRecordById(recordId);

    if (!record) {
        throw new NotFoundError("Record not found");
    }

    const isAdmin = requestingUser.role_id === ROLE_ID.ADMIN;
    const isOwner = String(record.user_id) === String(requestingUser.id);

    if (!isAdmin && !isOwner) {
        throw new ForbiddenError("Not allowed to delete this record");
    }

    deleteRecordById(recordId);
}


export { createRecordService, deleteRecordService, getRecordByIdService, getRecordsService, updateRecordService };

