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
  });
});

const getYearlyGuestHostChart = catchAsync(async (req, res) => {
  const year = req.query.year
    ? Number(req.query.year)
    : new Date().getUTCFullYear();
  const data = await AnalyticsServices.getGuestHostYearlyChart(year);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Yearly Guest and Host charts are retrieved successfully",
    data,
  });
});

const getYearlyGuestHostChartFromDB = catchAsync(async (req, res) => {
  const year = req.query.year
    ? Number(req.query.year)
    : new Date().getUTCFullYear();

  const result = await AnalyticsServices.getGuestHostYearlyChart(year);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Yearly guest and host charts are retrieved successfully",
    data: result,
  });
});

const getYearlyGuestHostChartsFromDB = catchAsync(async (req, res) => {
  const years = req.query.year
    ? Number(req.query.year)
    : new Date().getUTCFullYear();

  const result = await AnalyticsServices.getGuestHostYearlyChart(years);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Successfully retrieved yearly guest host charts",
    data: result,
  });
});

const statCountsAre = catchAsync(async (req, res) => {
  const result = await AnalyticsServices.statCountsFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Successfully retrieved stats count",
    data: result,
  });
});

const status = catchAsync(async (req, res) => {
  const result = await AnalyticsServices.getGuestHostYearlyChart();

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Successfully guest host year chart is retrieved successfully",
    data: result,
  });
});

const statusByCounts = catchAsync(async (req, res) => {});

export const AnalyticsControllers = {
  statCounts,
  getYearlyGuestHostChart,
};
