import { HOST_STATUS, USER_ROLES } from "../../../enums/user";
import { IHostRequestInput, IUser } from "./user.interface";
import { JwtPayload, Secret } from "jsonwebtoken";
import { User } from "./user.model";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import unlinkFile from "../../../shared/unlinkFile";
import { twilioService } from "../twilioService/sendOtpWithVerify";
import { jwtHelper } from "../../../helpers/jwtHelper";
import config from "../../../config";

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

const createUserToDB = async (payload: Partial<IUser>) => {

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

    user.nidFrontPic = payload.nidBackPic;
    user.nidBackPic = payload.nidBackPic;
    if (payload.drivingLicenseFrontPic) user.drivingLicenseFrontPic = payload.drivingLicenseFrontPic;
    if (payload.drivingLicenseBackPic) user.drivingLicenseBackPic = payload.drivingLicenseBackPic;

    // host PENDING
    user.hostStatus = HOST_STATUS.PENDING;

    await user.save();

    return user;

}

const getAllHostRequestsFromDB = async () => {
    const result = await User.find({ hostStatus: { $in: [HOST_STATUS.PENDING, HOST_STATUS.APPROVED, HOST_STATUS.REJECTED] } });

    if (!result) throw new ApiError(404, "Host requests are not found in the database");

    return result;

}

const getHostRequestByIdFromDB = async (id: string) => {
    const result = await User.findById(id);

    if (!result) throw new ApiError(404, "No host requsest is found in the database by this ID");

    return result;

}

const changeHostRequestStatusByIdFromDB = async (id: string, hostStatus: HOST_STATUS.PENDING | HOST_STATUS.APPROVED | HOST_STATUS.REJECTED) => {

    const result = await User.findByIdAndUpdate(id, { hostStatus }, { new: true });

    if (!result) throw new ApiError(404, "Failed to change host request status");

    return result;

}

export const UserService = {
    createUserToDB,
    getUserProfileFromDB,
    updateProfileToDB,
    createAdminToDB,
    switchProfileToDB,
    createHostRequestToDB,
    getAllHostRequestsFromDB,
    getHostRequestByIdFromDB,
    changeHostRequestStatusByIdFromDB,
};