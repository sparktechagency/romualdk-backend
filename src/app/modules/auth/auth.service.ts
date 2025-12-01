import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../../config';
import ApiError from '../../../errors/ApiErrors';
import { jwtHelper } from '../../../helpers/jwtHelper';
import {
    IChangePassword,
    ILoginData,
} from '../../../types/auth';
import { User } from '../user/user.model';
import { twilioService } from '../twilioService/sendOtpWithVerify';
import cryptoToken from '../../../util/cryptoToken';
import { ResetToken } from '../resetToken/resetToken.model';

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

const loginUserFromDB = async (payload: ILoginData) => {
    const { email, phone, password } = payload;

    console.log(email,password)

    // Either phone or email must be provided
    if (!phone && !email) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Please provide phone or email");
    }

    // Build dynamic query
    const query: any = {};
    if (phone) query.phone = phone;
    if (email) query.email = email;

    const user: any = await User.findOne(query).select("+password");

    if (!user) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }

    if (!user.verified) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Please verify your phone number first");
    }

    const isPasswordCorrect = await User.isMatchPassword(password, user.password);
    if (!isPasswordCorrect) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Password incorrect");
    }

    const accessToken = jwtHelper.createToken(
        { id: user._id, role: user.role },
        config.jwt.jwt_secret as Secret,
        config.jwt.jwt_expire_in as string
    );

    const userObj = user.toObject();
    delete userObj.password;

    return {
        token: accessToken,
        user: userObj,
    };
};


//forget password - ADD countryCode parameter
const forgetPasswordToDB = async (phone: string, countryCode: string) => {

    const user = await User.findOne({ phone, countryCode });
    if (!user) throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");

    // ✅ Pass countryCode to Twilio
    await twilioService.sendOTPWithVerify(phone, countryCode);

    return { message: "OTP sent to your phone" };
};


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

const verifyPhoneToDB = async (payload: { phone: string; code: string; countryCode: string }) => {
    const { phone, code, countryCode } = payload;

    // check user exist
    const isExistUser = await User.findOne({ phone, countryCode }).select("+authentication");
    if (!isExistUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }

    // OTP validation
    const isValid = await twilioService.verifyOTP(phone, code, countryCode);
    if (!isValid) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid or expired OTP");
    }

    let message;
    let data;

    // CASE–1: First time verify (like email verified = true)
    if (!isExistUser.verified) {
        await User.findOneAndUpdate(
            { _id: isExistUser._id },
            {
                verified: true,
                authentication: { oneTimeCode: null, expireAt: null, isResetPassword: false }
            }
        );

        message = "Your account is verified successfully";
    }
    // CASE–2: Forgot password flow (same as old email logic)
    else {
        await User.findOneAndUpdate(
            { _id: isExistUser._id },
            {
                authentication: {
                    isResetPassword: true,
                    oneTimeCode: null,
                    expireAt: null,
                },
            }
        );

        // token generate exactly same way
        const createToken = cryptoToken();

        // save token in ResetToken Collection
        await ResetToken.create({
            user: isExistUser._id,
            token: createToken,
            expireAt: new Date(Date.now() + 5 * 60000), // 5 min
        });

        message = "Verification successful: Use this token to reset your password";
        data = createToken;
    }

    return { data, message };
};



//reset password - ADD countryCode parameter
const resetPasswordToDB = async (
    token: string,
    payload: { newPassword: string; confirmPassword: string }
) => {
    const { newPassword, confirmPassword } = payload;

    // check matching
    if (newPassword !== confirmPassword) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "New password and Confirm password doesn't match!"
        );
    }

    // token exist?
    const isExistToken = await ResetToken.isExistToken(token);
    if (!isExistToken) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "You are not authorized");
    }

    // user permission
    const isExistUser = await User.findById(isExistToken.user).select(
        "+authentication"
    );

    if (!isExistUser?.authentication?.isResetPassword) {
        throw new ApiError(
            StatusCodes.UNAUTHORIZED,
            "You don't have permission to change the password. Please try 'Forgot Password' again."
        );
    }

    // token validity
    const isValid = await ResetToken.isExpireToken(token);
    if (!isValid) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Token expired, please try again."
        );
    }

    // hash password
    const hashPassword = await bcrypt.hash(
        newPassword,
        Number(config.bcrypt_salt_rounds)
    );

    const updateData = {
        password: hashPassword,
        authentication: { isResetPassword: false },
    };

    const result = await User.findOneAndUpdate(
        { _id: isExistToken.user },
        updateData,
        { new: true }
    );

    return result;
};



const changePasswordToDB = async (user: JwtPayload, payload: IChangePassword) => {

    const { currentPassword, newPassword, confirmPassword } = payload;
    const isExistUser = await User.findById(user.id).select('+password');
    if (!isExistUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }

    //current password match
    if (currentPassword && !(await User.isMatchPassword(currentPassword, isExistUser.password))) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is incorrect');
    }

    //newPassword and current password
    if (currentPassword === newPassword) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Please give different password from current password');
    }

    //new password and confirm password check
    if (newPassword !== confirmPassword) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Password and Confirm password doesn't matched");
    }

    //hash password
    const hashPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

    const updateData = {
        password: hashPassword,
    };

    const result = await User.findOneAndUpdate({ _id: user.id }, updateData, { new: true });

    return result;

};


const newAccessTokenToUser = async (token: string) => {

    // Check if the token is provided
    if (!token) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Token is required!');
    }

    const verifyUser = jwtHelper.verifyToken(
        token,
        config.jwt.jwtRefreshSecret as Secret
    );

    const isExistUser = await User.findById(verifyUser?.id);
    if (!isExistUser) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized access")
    }

    //create token
    const result = jwtHelper.createToken(
        { id: isExistUser._id, role: isExistUser.role, email: isExistUser.email },
        config.jwt.jwt_secret as Secret,
        config.jwt.jwt_expire_in as string
    );

    return result;
}

// resend OTP - ADD countryCode parameter
const resendPhoneOTPToDB = async (phone: string, countryCode: string) => {

    const user = await User.findOne({ phone, countryCode });
    if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User doesn't exist!");
    }

    if (user.verified) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User already verified!");
    }

    // ✅ Pass countryCode to Twilio
    const result = await twilioService.sendOTPWithVerify(phone, countryCode);

    return result;
};



// delete user
const deleteUserFromDB = async (user: JwtPayload, password: string) => {

    const isExistUser = await User.findById(user.id).select('+password');
    if (!isExistUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }

    //check match password
    if (password && !(await User.isMatchPassword(password, isExistUser.password))) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is incorrect');
    }

    const result = await User.findByIdAndDelete(user.id);
    if (!result) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    return result;
};

export const AuthService = {
    verifyPhoneToDB,
    loginUserFromDB,
    forgetPasswordToDB,
    resetPasswordToDB,
    changePasswordToDB,
    newAccessTokenToUser,
    resendPhoneOTPToDB,
    deleteUserFromDB
};