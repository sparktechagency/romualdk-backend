"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const auth_service_1 = require("./auth.service");
// verify Phone OTP
const verifyPhone = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const verifyData = __rest(req.body, []);
    const result = yield auth_service_1.AuthService.verifyPhoneToDB(verifyData);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Successfully verified your account",
        data: result,
    });
}));
// login User
const loginUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = req.body;
    const result = yield auth_service_1.AuthService.loginUserFromDB(data);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'User login successful',
        data: result
    });
}));
// forget Password (Send OTP)
const forgetPassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone, countryCode } = req.body; // ✅ Added countryCode
    const result = yield auth_service_1.AuthService.forgetPasswordToDB(phone, countryCode);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'OTP sent to your phone!',
        data: result
    });
}));
// reset Password
const resetPassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.headers.resettoken;
    const resetData = __rest(req.body, []);
    const result = yield auth_service_1.AuthService.resetPasswordToDB(token, resetData);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Your password has been successfully reset.",
        data: result,
    });
}));
// change Password
const changePassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    yield auth_service_1.AuthService.changePasswordToDB(user, {
        currentPassword,
        newPassword,
        confirmPassword
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Password changed successfully',
    });
}));
// new Access Token
const newAccessToken = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.body;
    const result = yield auth_service_1.AuthService.newAccessTokenToUser(token);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'New access token generated successfully',
        data: result
    });
}));
// resend OTP (Phone)
const resendPhoneOTP = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone, countryCode } = req.body; // ✅ Added countryCode
    const result = yield auth_service_1.AuthService.resendPhoneOTPToDB(phone, countryCode);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'OTP resent successfully',
        data: result
    });
}));
// delete User Account
const deleteUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { password } = req.body;
    const result = yield auth_service_1.AuthService.deleteUserFromDB(req.user, password);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Account deleted successfully',
        data: result
    });
}));
exports.AuthController = {
    verifyPhone,
    loginUser,
    forgetPassword,
    resetPassword,
    changePassword,
    newAccessToken,
    resendPhoneOTP,
    deleteUser
};
