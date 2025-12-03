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
exports.UserService = void 0;
const user_1 = require("../../../enums/user");
const user_model_1 = require("./user.model");
const http_status_codes_1 = require("http-status-codes");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const unlinkFile_1 = __importDefault(require("../../../shared/unlinkFile"));
const sendOtpWithVerify_1 = require("../twilioService/sendOtpWithVerify");
const jwtHelper_1 = require("../../../helpers/jwtHelper");
const config_1 = __importDefault(require("../../../config"));
const queryBuilder_1 = __importDefault(require("../../builder/queryBuilder"));
const createAdminToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // check admin is exist or not;
    const isExistAdmin = yield user_model_1.User.findOne({ email: payload.email });
    if (isExistAdmin) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.CONFLICT, "This Email already taken");
    }
    // create admin to db
    const createAdmin = yield user_model_1.User.create(payload);
    if (!createAdmin) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Failed to create Admin");
    }
    else {
        yield user_model_1.User.findByIdAndUpdate({ _id: createAdmin === null || createAdmin === void 0 ? void 0 : createAdmin._id }, { verified: true }, { new: true });
    }
    return createAdmin;
});
const getAdminFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const baseQuery = user_model_1.User.find({ role: { $in: [user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN] } }).select('firstName lastName email role profileImage createdAt updatedAt');
    const queryBuilder = new queryBuilder_1.default(baseQuery, query)
        .search(['firstName', "lastName", "fullName", 'email'])
        .sort()
        .fields()
        .paginate();
    const admins = yield queryBuilder.modelQuery;
    const meta = yield queryBuilder.countTotal();
    return {
        data: admins,
        meta,
    };
});
const deleteAdminFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistAdmin = yield user_model_1.User.findByIdAndDelete(id);
    if (!isExistAdmin) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to delete Admin');
    }
    return isExistAdmin;
});
const createUserToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const requiredFields = [
        "firstName",
        "lastName",
        "countryCode",
        "dateOfBirth",
        "phone",
        "password",
    ];
    const missingFields = requiredFields.filter((field) => !payload[field]);
    if (missingFields.length > 0) {
        throw new ApiErrors_1.default(400, `Missing required fields: ${missingFields.join(", ")}`);
    }
    const createUser = yield user_model_1.User.create(payload);
    console.log(payload, "Payload");
    if (!createUser)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create user');
    // Send OTP using Twilio Verify
    yield sendOtpWithVerify_1.twilioService.sendOTPWithVerify(createUser.phone, createUser.countryCode);
    const createToken = jwtHelper_1.jwtHelper.createToken({
        id: createUser._id,
        email: createUser.email,
        role: createUser.role,
    }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
    const result = {
        token: createToken,
        user: createUser,
    };
    return result;
});
const getUserProfileFromDB = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = user;
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    return isExistUser;
});
const updateProfileToDB = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = user;
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    //unlink file here
    if (payload.profileImage && isExistUser.profileImage) {
        (0, unlinkFile_1.default)(isExistUser.profileImage);
    }
    const updateDoc = yield user_model_1.User.findOneAndUpdate({ _id: id }, payload, {
        new: true,
    });
    return updateDoc;
});
const switchProfileToDB = (userId, role) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user)
        throw new ApiErrors_1.default(404, "This user is not found in the database");
    if (![user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST].includes(role))
        throw new ApiErrors_1.default(400, "Role is mustbe either 'USER' or 'HOST'");
    if (role === user_1.USER_ROLES.HOST && user.hostStatus !== user_1.HOST_STATUS.APPROVED) {
        throw new ApiErrors_1.default(400, "User cannot switch to host before admin approval");
    }
    const result = yield user_model_1.User.findByIdAndUpdate(userId, { role }, { new: true });
    if (!result)
        throw new ApiErrors_1.default(400, "Failed to update role");
    return result;
});
const createHostRequestToDB = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user)
        throw new ApiErrors_1.default(404, "No user is found for this ID");
    if (user.hostStatus === user_1.HOST_STATUS.APPROVED)
        throw new ApiErrors_1.default(400, "User is already a host");
    if (!payload.nidFrontPic || !payload.nidBackPic) {
        throw new ApiErrors_1.default(400, "Nid front picture and nid back picture is required");
    }
    user.nidFrontPic = payload.nidFrontPic;
    user.nidBackPic = payload.nidBackPic;
    if (payload.drivingLicenseFrontPic)
        user.drivingLicenseFrontPic = payload.drivingLicenseFrontPic;
    if (payload.drivingLicenseBackPic)
        user.drivingLicenseBackPic = payload.drivingLicenseBackPic;
    // host PENDING
    user.hostStatus = user_1.HOST_STATUS.PENDING;
    yield user.save();
    return user;
});
const getAllHostRequestsFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const baseQuery = user_model_1.User.find({ hostStatus: { $in: [user_1.HOST_STATUS.PENDING, user_1.HOST_STATUS.APPROVED, user_1.HOST_STATUS.REJECTED] } });
    const queryBuilder = new queryBuilder_1.default(baseQuery, query)
        .search(["firstName", "lastName", "fullName", "email", "phone"])
        .sort()
        .fields()
        .filter()
        .paginate();
    const hosts = yield queryBuilder.modelQuery;
    const meta = yield queryBuilder.countTotal();
    if (!hosts)
        throw new ApiErrors_1.default(404, "Host requests are not found in the database");
    return {
        data: hosts,
        meta,
    };
});
const getHostRequestByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_model_1.User.findOne({ _id: id, hostStatus: { $in: [user_1.HOST_STATUS.PENDING, user_1.HOST_STATUS.APPROVED, user_1.HOST_STATUS.REJECTED] } });
    if (!result)
        throw new ApiErrors_1.default(404, "No host requsest is found in the database by this ID");
    return result;
});
const changeHostRequestStatusByIdFromDB = (id, hostStatus) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ _id: id, hostStatus: { $in: [user_1.HOST_STATUS.PENDING, user_1.HOST_STATUS.APPROVED, user_1.HOST_STATUS.REJECTED] } });
    const userId = user === null || user === void 0 ? void 0 : user._id;
    if (!user)
        throw new ApiErrors_1.default(404, "No user is found host requst by this ID");
    const result = yield user_model_1.User.findByIdAndUpdate(userId, { hostStatus }, { new: true });
    if (!result)
        throw new ApiErrors_1.default(404, "Failed to change host request status");
    return result;
});
const deleteHostRequestByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(id);
    console.log(user, "USER");
    if (!user)
        throw new ApiErrors_1.default(404, "No user is found by this ID");
    if ((user === null || user === void 0 ? void 0 : user.hostStatus) === user_1.HOST_STATUS.NONE)
        throw new ApiErrors_1.default(404, "No host request found by this ID");
    user.hostStatus = user_1.HOST_STATUS.NONE;
    user.nidFrontPic = "";
    user.nidBackPic = "";
    if (user.drivingLicenseFrontPic)
        user.drivingLicenseFrontPic = "";
    if (user.drivingLicenseBackPic)
        user.drivingLicenseBackPic = "";
    yield user.save();
    return user;
});
const getAllUsersFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const baseQuery = user_model_1.User.find({ hostStatus: user_1.HOST_STATUS.NONE, role: user_1.USER_ROLES.USER });
    const queryBuilder = new queryBuilder_1.default(baseQuery, query)
        .search(["firstName", "lastName", "fullName", "email", "phone"])
        .sort()
        .fields()
        .filter()
        .paginate();
    const users = yield queryBuilder.modelQuery;
    const meta = yield queryBuilder.countTotal();
    if (!users)
        throw new ApiErrors_1.default(404, "No users are found in the database");
    return {
        data: users,
        meta,
    };
});
const getUserByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_model_1.User.findOne({ _id: id, hostStatus: user_1.HOST_STATUS.NONE, role: user_1.USER_ROLES.USER });
    if (!result)
        throw new ApiErrors_1.default(404, "No user is found in the database by this ID");
    return result;
});
const updateUserStatusByIdToDB = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    if (![user_1.STATUS.ACTIVE, user_1.STATUS.INACTIVE].includes(status)) {
        throw new ApiErrors_1.default(400, "Status must be either 'ACTIVE' or 'INACTIVE'");
    }
    const user = yield user_model_1.User.findOne({ _id: id, role: user_1.USER_ROLES.USER, hostStatus: user_1.HOST_STATUS.NONE });
    if (!user) {
        throw new ApiErrors_1.default(404, "No user is found by this user ID");
    }
    const result = yield user_model_1.User.findByIdAndUpdate(id, { status }, { new: true });
    if (!result) {
        throw new ApiErrors_1.default(400, "Failed to change status by this user ID");
    }
    return result;
});
const deleteUserByIdFromD = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ _id: id, hostStatus: user_1.HOST_STATUS.NONE, role: user_1.USER_ROLES.USER });
    if (!user) {
        throw new ApiErrors_1.default(404, "User doest not exist in the database");
    }
    const result = yield user_model_1.User.findByIdAndDelete(id);
    if (!result) {
        throw new ApiErrors_1.default(400, "Failed to delete user by this ID");
    }
    return result;
});
const deleteProfileFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    const result = yield user_model_1.User.findByIdAndDelete(id);
    if (!result) {
        throw new ApiErrors_1.default(400, "Failed to delete this user");
    }
    return result;
});
const getAllHostsFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const baseQuery = user_model_1.User.find({ hostStatus: user_1.HOST_STATUS.APPROVED });
    const queryBuilder = new queryBuilder_1.default(baseQuery, query)
        .search(["firstName", "lastName", "fullName", "email", "phone"])
        .sort()
        .fields()
        .filter()
        .paginate();
    const hosts = yield queryBuilder.modelQuery;
    const meta = yield queryBuilder.countTotal();
    if (!hosts)
        throw new ApiErrors_1.default(404, "No hosts are found in the database");
    return {
        data: hosts,
        meta,
    };
});
const getHostByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_model_1.User.findOne({ _id: id, hostStatus: user_1.HOST_STATUS.APPROVED, role: user_1.USER_ROLES.USER });
    if (!result)
        throw new ApiErrors_1.default(404, "No host is found in the database by this ID");
    return result;
});
const updateHostStatusByIdToDB = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    if (![user_1.STATUS.ACTIVE, user_1.STATUS.INACTIVE].includes(status)) {
        throw new ApiErrors_1.default(400, "Status must be either 'ACTIVE' or 'INACTIVE'");
    }
    const host = yield user_model_1.User.findOne({ _id: id, hostStatus: user_1.HOST_STATUS.APPROVED });
    if (!host) {
        throw new ApiErrors_1.default(404, "No host is found by this host ID");
    }
    const result = yield user_model_1.User.findByIdAndUpdate(id, { status }, { new: true });
    if (!result) {
        throw new ApiErrors_1.default(400, "Failed to change status by this host ID");
    }
    return result;
});
exports.UserService = {
    createUserToDB,
    getAdminFromDB,
    deleteAdminFromDB,
    getUserProfileFromDB,
    updateProfileToDB,
    createAdminToDB,
    switchProfileToDB,
    createHostRequestToDB,
    getAllHostRequestsFromDB,
    getHostRequestByIdFromDB,
    changeHostRequestStatusByIdFromDB,
    deleteHostRequestByIdFromDB,
    getAllUsersFromDB,
    getUserByIdFromDB,
    updateUserStatusByIdToDB,
    deleteUserByIdFromD,
    deleteProfileFromDB,
    getAllHostsFromDB,
    getHostByIdFromDB,
    updateHostStatusByIdToDB,
};
