import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AnalyticsServices } from "./analytics.service";

const statCounts = catchAsync(async (req, res) => {
    const result = await AnalyticsServices.statCountsFromDB();
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Successfully retrieved stat counts",
        data: result,
    })
})

export const AnalyticsControllers = {
    statCounts
}