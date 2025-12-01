import { HOST_STATUS, STATUS, USER_ROLES } from "../../../enums/user";
import { IHostRequestInput, IUser } from "./user.interface";
import { JwtPayload, Secret } from "jsonwebtoken";
import { User } from "./user.model";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import unlinkFile from "../../../shared/unlinkFile";
import { twilioService } from "../twilioService/sendOtpWithVerify";
import { jwtHelper } from "../../../helpers/jwtHelper";
import config from "../../../config";
import QueryBuilder from "../../builder/queryBuilder";


const createAdminToDB = async (payload: any): Promise<IUser> => {
    // check admin is exist or not;
    const isExistAdmin = await User.findOne({ email: payload.email });
    if (isExistAdmin) {
        throw new ApiError(StatusCodes.CONFLICT, "This Email already taken");
    }

    // create admin to db
    const createAdmin = await User.create(payload);
    if (!createAdmin) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create Admin");
    } else {
        await User.findByIdAndUpdate(
            { _id: createAdmin?._id },
            { verified: true },
            { new: true }
        );
    }

    return createAdmin;
};

const getAdminFromDB = async (query: any) => {

    const baseQuery = User.find({ role: { $in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] } }).select('firstName lastName email role profileImage createdAt updatedAt');

    const queryBuilder = new QueryBuilder<IUser>(baseQuery, query)
        .search(['firstName', "lastName", "fullName", 'email'])
        .sort()
        .fields()
        .paginate();

    const admins = await queryBuilder.modelQuery;

    const meta = await queryBuilder.countTotal();

    return {
        data: admins,
        meta,
    };
};

const deleteAdminFromDB = async (id: any) => {
    const isExistAdmin = await User.findByIdAndDelete(id);

    if (!isExistAdmin) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete Admin');
    }

    return isExistAdmin;
};

const createUserToDB = async (payload: Partial<IUser>) => {

    const requiredFields = [
        "firstName",
        "lastName",
        "countryCode",
        "dateOfBirth",
        "phone",
        "password",
    ];

    const missingFields = requiredFields.filter(
        (field) => !payload[field as keyof IUser]
    );

    if (missingFields.length > 0) {
        throw new ApiError(
            400,
            `Missing required fields: ${missingFields.join(", ")}`
        );
    }

    const createUser = await User.create(payload);
    console.log(payload, "Payload")
    if (!createUser) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user');

    // Send OTP using Twilio Verify
    await twilioService.sendOTPWithVerify(createUser.phone, createUser.countryCode);

    const createToken = jwtHelper.createToken(
        {
            id: createUser._id,
            email: createUser.email,
            role: createUser.role,
        },
        config.jwt.jwt_secret as Secret,
        config.jwt.jwt_expire_in as string
    );

    const result = {
        token: createToken,
        user: createUser,
    };

    return result;

};

const getUserProfileFromDB = async (user: JwtPayload): Promise<Partial<IUser>> => {
    const { id } = user;
    const isExistUser: any = await User.isExistUserById(id);
    if (!isExistUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    return isExistUser;
};

const updateProfileToDB = async (
    user: JwtPayload,
    payload: Partial<IUser>
): Promise<Partial<IUser | null>> => {
    const { id } = user;
    const isExistUser = await User.isExistUserById(id);
    if (!isExistUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }

    //unlink file here
    if (payload.profileImage && isExistUser.profileImage) {
        unlinkFile(isExistUser.profileImage);
    }

    const updateDoc = await User.findOneAndUpdate({ _id: id }, payload, {
        new: true,
    });
    return updateDoc;
};

const switchProfileToDB = async (userId: string, role: USER_ROLES.USER | USER_ROLES.HOST) => {
    const user = await User.findById(userId);

    if (!user) throw new ApiError(404, "This user is not found in the database");

    if (![USER_ROLES.USER, USER_ROLES.HOST].includes(role)) throw new ApiError(400, "Role is mustbe either 'USER' or 'HOST'")

    if (role === USER_ROLES.HOST && user.hostStatus !== HOST_STATUS.APPROVED) {
        throw new ApiError(400, "User cannot switch to host before admin approval");
    }

    const result = await User.findByIdAndUpdate(userId, { role }, { new: true });

    if (!result) throw new ApiError(400, "Failed to update role")

    return result;

}

const createHostRequestToDB = async (userId: string, payload: IHostRequestInput) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "No user is found for this ID");

    if (user.hostStatus === HOST_STATUS.APPROVED) throw new ApiError(400, "User is already a host");

    if (!payload.nidFrontPic || !payload.nidBackPic) {
        throw new ApiError(400, "Nid front picture and nid back picture is required")
    }

    user.nidFrontPic = payload.nidFrontPic;
    user.nidBackPic = payload.nidBackPic;
    if (payload.drivingLicenseFrontPic) user.drivingLicenseFrontPic = payload.drivingLicenseFrontPic;
    if (payload.drivingLicenseBackPic) user.drivingLicenseBackPic = payload.drivingLicenseBackPic;

    // host PENDING
    user.hostStatus = HOST_STATUS.PENDING;

    await user.save();

    return user;

}

const getAllHostRequestsFromDB = async (query: any) => {

    const baseQuery = User.find({ hostStatus: { $in: [HOST_STATUS.PENDING, HOST_STATUS.APPROVED, HOST_STATUS.REJECTED] } });

    const queryBuilder = new QueryBuilder(baseQuery, query)
        .search(["firstName", "lastName", "fullName", "email", "phone"])
        .sort()
        .fields()
        .filter()
        .paginate();

    const hosts = await queryBuilder.modelQuery;

    const meta = await queryBuilder.countTotal();

    if (!hosts) throw new ApiError(404, "Host requests are not found in the database");

    return {
        data: hosts,
        meta,
    }

}

const getHostRequestByIdFromDB = async (id: string) => {
    const result = await User.findOne({ _id: id, hostStatus: { $in: [HOST_STATUS.PENDING, HOST_STATUS.APPROVED, HOST_STATUS.REJECTED] } });

    if (!result) throw new ApiError(404, "No host requsest is found in the database by this ID");

    return result;

}

const changeHostRequestStatusByIdFromDB = async (id: string, hostStatus: HOST_STATUS.PENDING | HOST_STATUS.APPROVED | HOST_STATUS.REJECTED) => {

    const user = await User.findOne({ _id: id, hostStatus: { $in: [HOST_STATUS.PENDING, HOST_STATUS.APPROVED, HOST_STATUS.REJECTED] } });

    const userId = user?._id;

    if (!user) throw new ApiError(404, "No user is found host requst by this ID")

    const result = await User.findByIdAndUpdate(userId, { hostStatus }, { new: true });

    if (!result) throw new ApiError(404, "Failed to change host request status");

    return result;

}

const deleteHostRequestByIdFromDB = async (id: string) => {
    const user = await User.findById(id);
    console.log(user, "USER")

    if (!user) throw new ApiError(404, "No user is found by this ID")

    if (user?.hostStatus === HOST_STATUS.NONE) throw new ApiError(404, "No host request found by this ID");

    user.hostStatus = HOST_STATUS.NONE;
    user.nidFrontPic = ""
    user.nidBackPic = ""

    if (user.drivingLicenseFrontPic) user.drivingLicenseFrontPic = ""
    if (user.drivingLicenseBackPic) user.drivingLicenseBackPic = ""

    await user.save();

    return user;


}

const getAllUsersFromDB = async (query: any) => {


    const baseQuery = User.find({ hostStatus: HOST_STATUS.NONE, role: USER_ROLES.USER });

    const queryBuilder = new QueryBuilder(baseQuery, query)
        .search(["firstName", "lastName", "fullName", "email", "phone"])
        .sort()
        .fields()
        .filter()
        .paginate();

    const users = await queryBuilder.modelQuery;

    const meta = await queryBuilder.countTotal();

    if (!users) throw new ApiError(404, "No users are found in the database");

    return {
        data: users,
        meta,
    }

}

const getUserByIdFromDB = async (id: string) => {
    const result = await User.findOne({ _id: id, hostStatus: HOST_STATUS.NONE, role: USER_ROLES.USER });

    if (!result) throw new ApiError(404, "No user is found in the database by this ID");

    return result;

}

const updateUserStatusByIdToDB = async (
    id: string,
    status: STATUS.ACTIVE | STATUS.INACTIVE
) => {
    if (![STATUS.ACTIVE, STATUS.INACTIVE].includes(status)) {
        throw new ApiError(400, "Status must be either 'ACTIVE' or 'INACTIVE'");
    }

    const user = await User.findOne({ _id: id, role: USER_ROLES.USER, hostStatus: HOST_STATUS.NONE });
    if (!user) {
        throw new ApiError(404, "No user is found by this user ID");
    }

    const result = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!result) {
        throw new ApiError(400, "Failed to change status by this user ID");
    }

    return result;
};

const deleteUserByIdFromD = async (id: string) => {
    const user = await User.findOne({ _id: id, hostStatus: HOST_STATUS.NONE, role: USER_ROLES.USER });

    if (!user) {
        throw new ApiError(404, "User doest not exist in the database");
    }

    const result = await User.findByIdAndDelete(id);

    if (!result) {
        throw new ApiError(400, "Failed to delete user by this ID");
    }

    return result;
};

const deleteProfileFromDB = async (id: string) => {
    const isExistUser = await User.isExistUserById(id);
    if (!isExistUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }

    const result = await User.findByIdAndDelete(id);

    if (!result) {
        throw new ApiError(400, "Failed to delete this user");
    }
    return result;
};

const getAllHostsFromDB = async (query: any) => {


    const baseQuery = User.find({ hostStatus: HOST_STATUS.APPROVED });

    const queryBuilder = new QueryBuilder(baseQuery, query)
        .search(["firstName", "lastName", "fullName", "email", "phone"])
        .sort()
        .fields()
        .filter()
        .paginate();

    const hosts = await queryBuilder.modelQuery;

    const meta = await queryBuilder.countTotal();

    if (!hosts) throw new ApiError(404, "No hosts are found in the database");

    return {
        data: hosts,
        meta,
    }

}

const getHostByIdFromDB = async (id: string) => {
    const result = await User.findOne({ _id: id, hostStatus: HOST_STATUS.APPROVED, role: USER_ROLES.USER });

    if (!result) throw new ApiError(404, "No host is found in the database by this ID");

    return result;

}

const updateHostStatusByIdToDB = async (
    id: string,
    status: STATUS.ACTIVE | STATUS.INACTIVE
) => {
    if (![STATUS.ACTIVE, STATUS.INACTIVE].includes(status)) {
        throw new ApiError(400, "Status must be either 'ACTIVE' or 'INACTIVE'");
    }

    const host = await User.findOne({ _id: id, hostStatus: HOST_STATUS.APPROVED });
    if (!host) {
        throw new ApiError(404, "No host is found by this host ID");
    }

    const result = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!result) {
        throw new ApiError(400, "Failed to change status by this host ID");
    }

    return result;
};

export const UserService = {
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