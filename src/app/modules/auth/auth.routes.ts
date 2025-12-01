import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';

const router = express.Router();


// Login
router.post(
    '/login',
    validateRequest(AuthValidation.createLoginZodSchema),
    AuthController.loginUser
);


// Forgot Password (Send OTP)
router.post(
    '/forget-password',
    validateRequest(AuthValidation.createForgetPasswordZodSchema),
    AuthController.forgetPassword
);


// Refresh Token
router.post(
    '/refresh-token',
    AuthController.newAccessToken
);


// Resend OTP (Phone)
router.post(
    '/resend-otp',
    validateRequest(AuthValidation.createResendOTPSchema), // Zod validation for phone
    AuthController.resendPhoneOTP
);

// Verify Phone OTP
router.post(
    '/verify-phone',
    validateRequest(AuthValidation.createVerifyPhoneZodSchema),
    AuthController.verifyPhone
);

// Reset Password
router.post(
    '/reset-password',
    validateRequest(AuthValidation.createResetPasswordZodSchema),
    AuthController.resetPassword
);

// Change Password
router.post(
    '/change-password',
    auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.HOST),
    validateRequest(AuthValidation.createChangePasswordZodSchema),
    AuthController.changePassword
);


// Delete Account
router.delete(
    '/delete-account',
    auth(USER_ROLES.ADMIN),
    AuthController.deleteUser
);

export const AuthRoutes = router;
