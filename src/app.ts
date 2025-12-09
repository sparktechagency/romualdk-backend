import express, { Application, Request, Response } from "express";
import cors from "cors";
import { StatusCodes } from "http-status-codes";
import { Morgan } from "./shared/morgan";
import router from "../src/app/routes";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import path from "path";
import { paymentRoutes } from "./app/modules/payment/payment.routes";
import { stripeWebhook } from "./app/modules/payment/payment.controller";


const app: Application = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// morgan
app.use(Morgan.successHandler);
app.use(Morgan.errorHandler);

//body parser
app.use(cors());

app.post(
  "/api/v1/payments/webhook/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);


app.use(express.json());

app.use(express.urlencoded({ extended: true }));

//file retrieve
app.use(express.static("uploads"));

//router
app.use("/api/v1", router);


app.get("/", (req: Request, res: Response) => {
  res.send("Server is running...");
});

//global error handle
app.use(globalErrorHandler);

// handle not found route
app.use((req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "Not Found",
    errorMessages: [
      {
        path: req.originalUrl,
        message: "API DOESN'T EXIST",
      },
    ],
  });
});

export default app;
