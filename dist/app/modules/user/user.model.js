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
exports.User = void 0;
const mongoose_1 = require("mongoose");
const user_1 = require("../../../enums/user");
const bcrypt_1 = __importDefault(require("bcrypt"));
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const userSchema = new mongoose_1.Schema({
    firstName: {
        type: String,
        // required: true,
    },
    lastName: {
        type: String,
        // required: true,
    },
    role: {
        type: String,
        enum: Object.values(user_1.USER_ROLES),
        required: true,
    },
    hostStatus: {
        type: String,
        enum: Object.values(user_1.HOST_STATUS),
        required: false,
    },
    phone: {
        type: String,
        // required: true,
        // unique: true,
    },
    countryCode: {
        type: String,
        // required: true,
    },
    email: {
        type: String,
        required: false,
        unique: false,
        lowercase: true,
    },
    profileImage: {
        type: String,
        required: false,
    },
    nidFrontPic: {
        type: String,
        default: ""
    },
    nidBackPic: {
        type: String,
        default: ""
    },
    drivingLicenseFrontPic: {
        type: String,
        required: false,
    },
    drivingLicenseBackPic: {
        type: String,
        required: false,
    },
    password: {
        type: String,
        required: false,
        select: 0,
        minlength: 8,
    },
    dateOfBirth: {
        type: String,
        // required: true,
    },
    gender: {
        type: String,
        enum: Object.values(user_1.GENDER),
        required: false,
    },
    status: {
        type: String,
        enum: Object.values(user_1.STATUS),
        default: user_1.STATUS.ACTIVE,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number],
            default: [0, 0],
            index: "2dsphere",
        },
    },
    authentication: {
        type: {
            isResetPassword: {
                type: Boolean,
                default: false,
            },
            oneTimeCode: {
                type: Number,
                default: null,
            },
            expireAt: {
                type: Date,
                default: null,
            },
        },
        select: 0,
    },
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true, transform: (_doc, ret) => { delete ret.id; return ret; } },
    toObject: { virtuals: true, transform: (_doc, ret) => { delete ret.id; return ret; } },
});
userSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});
//exist user check
userSchema.statics.isExistUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isExist = yield exports.User.findById(id);
    return isExist;
});
userSchema.statics.isExistUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const isExist = yield exports.User.findOne({ email });
    return isExist;
});
//account check
userSchema.statics.isAccountCreated = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isUserExist = yield exports.User.findById(id);
    return isUserExist.accountInformation.status;
});
//is match password
userSchema.statics.isMatchPassword = (password, hashPassword) => __awaiter(void 0, void 0, void 0, function* () {
    return yield bcrypt_1.default.compare(password, hashPassword);
});
//check user
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isNew) {
            const isExist = yield exports.User.findOne({ phone: this.phone });
            if (isExist) {
                throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Phone number already exist!');
            }
            // password hash
            if (this.password) {
                this.password = yield bcrypt_1.default.hash(this.password, Number(config_1.default.bcrypt_salt_rounds));
            }
        }
        else {
            if (this.isModified('password') && this.password) {
                this.password = yield bcrypt_1.default.hash(this.password, Number(config_1.default.bcrypt_salt_rounds));
            }
        }
        next();
    });
});
exports.User = (0, mongoose_1.model)("User", userSchema);
