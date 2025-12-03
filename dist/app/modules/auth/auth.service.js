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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const jwtHelper_1 = require("../../../helpers/jwtHelper");
const user_model_1 = require("../user/user.model");
const sendOtpWithVerify_1 = require("../twilioService/sendOtpWithVerify");
const cryptoToken_1 = __importDefault(require("../../../util/cryptoToken"));
const resetToken_model_1 = require("../resetToken/resetToken.model");
//login
// const loginUserFromDB = async (payload: ILoginData) => {
//     const { phone, password } = payload;
//     const user: any = await User.findOne({ phone }).select('+password');
//     if (!user) throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
//     if (!user.verified)
//         throw new ApiError(StatusCodes.BAD_REQUEST, "Please verify your phone number first");
//     if (!(await User.isMatchPassword(password, user.password)))
//         throw new ApiError(StatusCodes.BAD_REQUEST, "Password incorrect");
//     const accessToken = jwtHelper.createToken(
//         { id: user._id, role: user.role },
//         config.jwt.jwt_secret as Secret,
//         config.jwt.jwt_expire_in as string,
//     );
//     const userObj = user.toObject();
//     delete userObj.password;
//     return {
//         token: accessToken,
//         user: userObj
//     };
// };
const loginUserFromDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, phone, password } = payload;
    console.log(email, password);
    // Either phone or email must be provided
    if (!phone && !email) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Please provide phone or email");
    }
    // Build dynamic query
    const query = {};
    if (phone)
        query.phone = phone;
    if (email)
        query.email = email;
    const user = yield user_model_1.User.findOne(query).select("+password");
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    if (!user.verified) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Please verify your phone number first");
    }
    const isPasswordCorrect = yield user_model_1.User.isMatchPassword(password, user.password);
    if (!isPasswordCorrect) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Password incorrect");
    }
    const accessToken = jwtHelper_1.jwtHelper.createToken({ id: user._id, role: user.role }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
    const userObj = user.toObject();
    delete userObj.password;
    return {
        token: accessToken,
        user: userObj,
    };
});
//forget password - ADD countryCode parameter
const forgetPasswordToDB = (phone, countryCode) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ phone, countryCode });
    if (!user)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    // ✅ Pass countryCode to Twilio
    yield sendOtpWithVerify_1.twilioService.sendOTPWithVerify(phone, countryCode);
    return { message: "OTP sent to your phone" };
});
//verify phone - ADD countryCode parameter
// const verifyPhoneToDB = async (phone: string, code: string, countryCode: string) => {
//     const user = await User.findOne({ phone, countryCode });
//     if (!user) throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
//     // ✅ Pass countryCode to Twilio
//     const isValid = await twilioService.verifyOTP(phone, code, countryCode);
//     if (!isValid) {
//         throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid or expired OTP");
//     }
//     const result = await User.findOneAndUpdate(
//         { phone, countryCode },
//         { verified: true }
//     );
//     return result;
// };
const verifyPhoneToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone, code, countryCode } = payload;
    // check user exist
    const isExistUser = yield user_model_1.User.findOne({ phone, countryCode }).select("+authentication");
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    // OTP validation
    const isValid = yield sendOtpWithVerify_1.twilioService.verifyOTP(phone, code, countryCode);
    if (!isValid) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid or expired OTP");
    }
    let message;
    let data;
    // CASE–1: First time verify (like email verified = true)
    if (!isExistUser.verified) {
        yield user_model_1.User.findOneAndUpdate({ _id: isExistUser._id }, {
            verified: true,
            authentication: { oneTimeCode: null, expireAt: null, isResetPassword: false }
        });
        message = "Your account is verified successfully";
    }
    // CASE–2: Forgot password flow (same as old email logic)
    else {
        yield user_model_1.User.findOneAndUpdate({ _id: isExistUser._id }, {
            authentication: {
                isResetPassword: true,
                oneTimeCode: null,
                expireAt: null,
            },
        });
        // token generate exactly same way
        const createToken = (0, cryptoToken_1.default)();
        // save token in ResetToken Collection
        yield resetToken_model_1.ResetToken.create({
            user: isExistUser._id,
            token: createToken,
            expireAt: new Date(Date.now() + 5 * 60000), // 5 min
        });
        message = "Verification successful: Use this token to reset your password";
        data = createToken;
    }
    return { data, message };
});
//reset password - ADD countryCode parameter
const resetPasswordToDB = (token, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { newPassword, confirmPassword } = payload;
    // check matching
    if (newPassword !== confirmPassword) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "New password and Confirm password doesn't match!");
    }
    // token exist?
    const isExistToken = yield resetToken_model_1.ResetToken.isExistToken(token);
    if (!isExistToken) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "You are not authorized");
    }
    // user permission
    const isExistUser = yield user_model_1.User.findById(isExistToken.user).select("+authentication");
    if (!((_a = isExistUser === null || isExistUser === void 0 ? void 0 : isExistUser.authentication) === null || _a === void 0 ? void 0 : _a.isResetPassword)) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "You don't have permission to change the password. Please try 'Forgot Password' again.");
    }
    // token validity
    const isValid = yield resetToken_model_1.ResetToken.isExpireToken(token);
    if (!isValid) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Token expired, please try again.");
    }
    // hash password
    const hashPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    const updateData = {
        password: hashPassword,
        authentication: { isResetPassword: false },
    };
    const result = yield user_model_1.User.findOneAndUpdate({ _id: isExistToken.user }, updateData, { new: true });
    return result;
});
const changePasswordToDB = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentPassword, newPassword, confirmPassword } = payload;
    const isExistUser = yield user_model_1.User.findById(user.id).select('+password');
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    //current password match
    if (currentPassword && !(yield user_model_1.User.isMatchPassword(currentPassword, isExistUser.password))) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Password is incorrect');
    }
    //newPassword and current password
    if (currentPassword === newPassword) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please give different password from current password');
    }
    //new password and confirm password check
    if (newPassword !== confirmPassword) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Password and Confirm password doesn't matched");
    }
    //hash password
    const hashPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    const updateData = {
        password: hashPassword,
    };
    const result = yield user_model_1.User.findOneAndUpdate({ _id: user.id }, updateData, { new: true });
    return result;
});
const newAccessTokenToUser = (token) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if the token is provided
    if (!token) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Token is required!');
    }
    const verifyUser = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.jwtRefreshSecret);
    const isExistUser = yield user_model_1.User.findById(verifyUser === null || verifyUser === void 0 ? void 0 : verifyUser.id);
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Unauthorized access");
    }
    //create token
    const result = jwtHelper_1.jwtHelper.createToken({ id: isExistUser._id, role: isExistUser.role, email: isExistUser.email }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
    return result;
});
// resend OTP - ADD countryCode parameter
const resendPhoneOTPToDB = (phone, countryCode) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ phone, countryCode });
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User doesn't exist!");
    }
    if (user.verified) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User already verified!");
    }
    // ✅ Pass countryCode to Twilio
    const result = yield sendOtpWithVerify_1.twilioService.sendOTPWithVerify(phone, countryCode);
    return result;
});
// delete user
const deleteUserFromDB = (user, password) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistUser = yield user_model_1.User.findById(user.id).select('+password');
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    //check match password
    if (password && !(yield user_model_1.User.isMatchPassword(password, isExistUser.password))) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Password is incorrect');
    }
    const result = yield user_model_1.User.findByIdAndDelete(user.id);
    if (!result) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    return result;
});
exports.AuthService = {
    verifyPhoneToDB,
    loginUserFromDB,
    forgetPasswordToDB,
    resetPasswordToDB,
    changePasswordToDB,
    newAccessTokenToUser,
    resendPhoneOTPToDB,
    deleteUserFromDB
};
