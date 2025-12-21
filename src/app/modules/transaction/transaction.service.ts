 
import { Types } from "mongoose";
import Transaction from "../payment/transaction.model";
import QueryBuilder from "../../builder/queryBuilder";

interface GetTransactionsQuery {
  [key: string]: unknown;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  status?: string;
}

const getAllTransactions = async (query: GetTransactionsQuery) => {
  const baseQuery = Transaction.find();
  const qb = new QueryBuilder(baseQuery, query);

  qb.search(["_id", "bookingId", "method", "status"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const transactions = await qb.modelQuery;
  const meta = await qb.countTotal();

  return { transactions, meta };
};

const getTransactionById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) throw new Error("Invalid Transaction ID");
  const transaction = await Transaction.findById(id);
  if (!transaction) throw new Error("Transaction not found");
  return transaction;
};

const updateTransaction = async (id: string, payload: Partial<typeof Transaction>) => {
  if (!Types.ObjectId.isValid(id)) throw new Error("Invalid Transaction ID");
  const transaction = await Transaction.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!transaction) throw new Error("Transaction not found");
  return transaction;
};

const deleteTransaction = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) throw new Error("Invalid Transaction ID");
  const transaction = await Transaction.findByIdAndDelete(id);
  if (!transaction) throw new Error("Transaction not found");
  return transaction;
};

export const TransactionService = {
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
