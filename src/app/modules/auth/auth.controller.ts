import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthService } from "./auth.service";

// verify Phone OTP
const verifyPhone = catchAsync(async (req: Request, res: Response) => {
  const { ...verifyData } = req.body;

  const result = await AuthService.verifyPhoneToDB(verifyData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Successfully verified your account",
    data: result,
  });
});

// login User
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;

  const result = await AuthService.loginUserFromDB(data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User login successful",
    data: result,
  });
});

// forget Password (Send OTP)
// const forgetPassword = catchAsync(async (req: Request, res: Response) => {
//   const { phone, countryCode } = req.body; // Added countryCode

//   const result = await AuthService.forgetPasswordToDB(phone, countryCode);

//   sendResponse(res, {
//     success: true,
//     statusCode: StatusCodes.OK,
//     message: "OTP sent to your phone!",
//     data: result,
//   });
// });

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, phone, countryCode } = req.body;

  const result = await AuthService.forgetPasswordToDB({
    email,
    phone,
    countryCode,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message:
      "Please check your email or phone. We have sent you a one-time passcode (OTP).",
    data: result,
  });
});

// reset Password
const resetPassword = catchAsync(async (req, res) => {
  const token: any = req.headers.resettoken;
  const { ...resetData } = req.body;
  const result = await AuthService.resetPasswordToDB(token!, resetData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Your password has been successfully reset.",
    data: result,
  });
});

// change Password
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  await AuthService.changePasswordToDB(user as any, {
    currentPassword,
    newPassword,
    confirmPassword,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Password changed successfully",
  });
});

// new Access Token
const newAccessToken = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.body;

  const result = await AuthService.newAccessTokenToUser(token);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "New access token generated successfully",
    data: result,
  });
});

// resend OTP (Phone)
const resendPhoneOTP = catchAsync(async (req: Request, res: Response) => {
  const { phone, countryCode } = req.body;

  const result = await AuthService.resendPhoneOTPToDB(phone, countryCode);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "OTP resent successfully",
    data: result,
  });
});

// delete User Account
const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { password } = req.body;

  const result = await AuthService.deleteUserFromDB(req.user as any, password);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Account deleted successfully",
    data: result,
  });
});

export const AuthController = {
  verifyPhone,
  loginUser,
  forgetPassword,
  resetPassword,
  changePassword,
  newAccessToken,
  resendPhoneOTP,
  deleteUser,
};
