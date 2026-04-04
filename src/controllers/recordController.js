import { createRecordService, deleteRecordService, getRecordByIdService, getRecordsService, updateRecordService } from "../services/recordService.js";
import { asyncHandler } from "../utils/apiError.js";

const createRecordController = asyncHandler(async (req, res) => {
    const record = createRecordService(req.user.id, req.body);

    res.status(201).json({
        status: "success",
        data: record,
        message: "Record created"
    });
});

const getAllRecordsController = asyncHandler(async (req, res) => {
    const records = getRecordsService(req.user, req.query);

    res.json({
        status: "success",
        noOfRecords: records.length,
        data: records
    });
});

const getRecordController = asyncHandler(async (req, res) => {
    const record = getRecordByIdService(req.user, req.params.id);

    res.status(200).json({
        status: "success",
        data: record
    });
});

const updateRecordController = asyncHandler(async (req, res) => {
    const record = updateRecordService(req.user, req.params.id, req.body);

    res.status(200).json({
        status: "success",
        data: record,
        message: "Record updated"
    });
});

const deleteRecordController = asyncHandler(async (req, res) => {
    deleteRecordService(req.user, req.params.id);

    res.status(200).json({
        status: "success",
        message: "Record deleted"
    });
});



export { createRecordController, deleteRecordController, getAllRecordsController, getRecordController, updateRecordController };

