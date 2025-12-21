import express from "express";
import { TransactionController } from "./transaction.controller";
import { USER_ROLES } from "../../../enums/user";
import auth from "../../middlewares/auth";
 

const router = express.Router();

// Admin + SuperAdmin routes
router.get(
  "/",
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  TransactionController.getAllTransactions
);

router.get(
  "/:id",
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  TransactionController.getTransactionById
);

router.patch(
  "/:id",
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  TransactionController.updateTransaction
);

router.delete(
  "/:id",
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  TransactionController.deleteTransaction
);

export const transactionRoutes = router;

