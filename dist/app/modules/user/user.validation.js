"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidation = void 0;
const zod_1 = require("zod");
const createAdminZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: zod_1.z.string({ required_error: 'First Name is required' }),
        lastName: zod_1.z.string({ required_error: 'Last name is required' }),
        email: zod_1.z.string({ required_error: 'Email is required' }),
        password: zod_1.z.string({ required_error: 'Password is required' }),
        role: zod_1.z.string({ required_error: 'Role is required' })
    })
});
exports.UserValidation = { createAdminZodSchema };
