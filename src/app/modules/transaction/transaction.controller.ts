import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { TransactionService } from "./transaction.service";
 

const getAllTransactions = catchAsync(async (req: Request, res: Response) => {
  const result = await TransactionService.getAllTransactions(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Transactions retrieved successfully",
    data: result.transactions,
    meta: result.meta,
  });
});

const getTransactionById = catchAsync(async (req: Request, res: Response) => {
  const result = await TransactionService.getTransactionById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Transaction retrieved successfully",
    data: result,
  });
});

const updateTransaction = catchAsync(async (req: Request, res: Response) => {
  const result = await TransactionService.updateTransaction(req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Transaction updated successfully",
    data: result,
  });
});

const deleteTransaction = catchAsync(async (req: Request, res: Response) => {
  const result = await TransactionService.deleteTransaction(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Transaction deleted successfully",
    data: result,
  });
});

export const TransactionController = {
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
