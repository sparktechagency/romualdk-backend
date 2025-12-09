<<<<<<< HEAD
import { z } from "zod";

// verify Phone OTP

const createVerifyPhoneZodSchema = z.object({
  body: z.object({
    phone: z.string({ required_error: "Phone is required" }),
    code: z.string({ required_error: "OTP code is required" }), // Twilio OTP as string
  }),
});

// login

const createLoginZodSchema = z.object({
  body: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    password: z.string({ required_error: "Password is required" }),
  }),
});

// forgot Password (Send OTP)

const createForgetPasswordZodSchema = z.object({
  body: z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
  }),
});

// reset Password

const createResetPasswordZodSchema = z.object({
  body: z.object({
    newPassword: z.string({ required_error: "New password is required" }),
    confirmPassword: z.string({
      required_error: "Confirm password is required",
    }),
  }),
});

// change Password

const createChangePasswordZodSchema = z.object({
  body: z.object({
    currentPassword: z.string({
      required_error: "Current password is required",
    }),
    newPassword: z.string({ required_error: "New password is required" }),
    confirmPassword: z.string({
      required_error: "Confirm password is required",
    }),
  }),
});

// resend OTP

const createResendOTPSchema = z.object({
  body: z.object({
    phone: z.string({ required_error: "Phone is required" }),
  }),
});

export const AuthValidation = {
  createVerifyPhoneZodSchema,
  createLoginZodSchema,
  createForgetPasswordZodSchema,
  createResetPasswordZodSchema,
  createChangePasswordZodSchema,
  createResendOTPSchema,
=======
import { z } from 'zod';

// Verify Phone OTP

const createVerifyPhoneZodSchema = z.object({
    body: z.object({
        phone: z.string({ required_error: 'Phone is required' }),
        code: z.string({ required_error: 'OTP code is required' }), // Twilio OTP as string
    })
});


// Login

const createLoginZodSchema = z.object({
    body: z.object({
        email: z.string().optional(),
        phone: z.string().optional(),
        password: z.string({ required_error: 'Password is required' })
    })
});


// Forgot Password (Send OTP)

const createForgetPasswordZodSchema = z.object({
    body: z.object({
        phone: z.string({ required_error: 'Phone is required' }),
    })
});


// Reset Password

const createResetPasswordZodSchema = z.object({
    body: z.object({
        newPassword: z.string({ required_error: 'New password is required' }),
        confirmPassword: z.string({ required_error: 'Confirm password is required' }),
    })
});


// Change Password

const createChangePasswordZodSchema = z.object({
    body: z.object({
        currentPassword: z.string({ required_error: 'Current password is required' }),
        newPassword: z.string({ required_error: 'New password is required' }),
        confirmPassword: z.string({ required_error: 'Confirm password is required' }),
    })
});


// Resend OTP

const createResendOTPSchema = z.object({
    body: z.object({
        phone: z.string({ required_error: 'Phone is required' }),
    })
});

export const AuthValidation = {
    createVerifyPhoneZodSchema,
    createLoginZodSchema,
    createForgetPasswordZodSchema,
    createResetPasswordZodSchema,
    createChangePasswordZodSchema,
    createResendOTPSchema
>>>>>>> clean-payment
};
