"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthValidation = void 0;
const zod_1 = require("zod");
// Verify Phone OTP
const createVerifyPhoneZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        phone: zod_1.z.string({ required_error: 'Phone is required' }),
        code: zod_1.z.string({ required_error: 'OTP code is required' }), // Twilio OTP as string
    })
});
// Login
const createLoginZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        password: zod_1.z.string({ required_error: 'Password is required' })
    })
});
// Forgot Password (Send OTP)
const createForgetPasswordZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        phone: zod_1.z.string({ required_error: 'Phone is required' }),
    })
});
// Reset Password
const createResetPasswordZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        newPassword: zod_1.z.string({ required_error: 'New password is required' }),
        confirmPassword: zod_1.z.string({ required_error: 'Confirm password is required' }),
    })
});
// Change Password
const createChangePasswordZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string({ required_error: 'Current password is required' }),
        newPassword: zod_1.z.string({ required_error: 'New password is required' }),
        confirmPassword: zod_1.z.string({ required_error: 'Confirm password is required' }),
    })
});
// Resend OTP
const createResendOTPSchema = zod_1.z.object({
    body: zod_1.z.object({
        phone: zod_1.z.string({ required_error: 'Phone is required' }),
    })
});
exports.AuthValidation = {
    createVerifyPhoneZodSchema,
    createLoginZodSchema,
    createForgetPasswordZodSchema,
    createResetPasswordZodSchema,
    createChangePasswordZodSchema,
    createResendOTPSchema
};
