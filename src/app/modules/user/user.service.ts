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
import { PipelineStage, Types } from "mongoose";
import { afrikSmsService } from "../../../helpers/afrikSms.service";

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
      { new: true },
    );
  }

  return createAdmin;
};

const getAdminFromDB = async (query: any) => {
  const baseQuery = User.find({
    role: { $in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] },
  }).select("firstName lastName email role profileImage createdAt updatedAt status");

  const queryBuilder = new QueryBuilder<IUser>(baseQuery, query)
    .search(["firstName", "lastName", "fullName", "email"])
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
    throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to delete Admin");
  }

  return isExistAdmin;
};

// const createUserToDB = async (payload: Partial<IUser>) => {
//   const requiredFields = [
//     "firstName",
//     "lastName",
//     "countryCode",
//     "dateOfBirth",
//     "phone",
//     "password",
//   ];

//   const missingFields = requiredFields.filter(
//     (field) => !payload[field as keyof IUser],
//   );

//   if (missingFields.length > 0) {
//     throw new ApiError(
//       400,
//       `Missing required fields: ${missingFields.join(", ")}`,
//     );
//   }

//   const createUser = await User.create(payload);
//   console.log(payload, "Payload");
//   if (!createUser)
//     throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create user");

//   // Send OTP using Twilio Verify
//   await twilioService.sendOTPWithVerify(
//     createUser.phone,
//     createUser.countryCode,
//   );

//   const createToken = jwtHelper.createToken(
//     {
//       id: createUser._id,
//       phone: createUser.phone,
//       role: createUser.role,
//     },
//     config.jwt.jwt_secret as Secret,
//     config.jwt.jwt_expire_in as string,
//   );

//   const result = {
//     token: createToken,
//     user: createUser,
//   };

//   return result;
// };

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
    throw new ApiError(400, `Missing required fields: ${missingFields.join(", ")}`);
  }

  // generate numeric OTP
  const otp = afrikSmsService.generateOTP();
  const expireAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  payload.authentication = {
    oneTimeCode: otp,
    expireAt: expireAt,
    isResetPassword: false
  };

  const createUser = await User.create(payload);

  if (!createUser)
    throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create user");

  const smsMessage = `Your Emma verification code is ${otp}. Valid for 5 minutes.`;

  try {
    await afrikSmsService.sendSMS(
      createUser.phone,
      createUser.countryCode,
      smsMessage
    );
  } catch (error) {
    console.error("SMS Sending failed:", error);

  }

  const createToken = jwtHelper.createToken(
    {
      id: createUser._id,
      phone: createUser.phone,
      role: createUser.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string,
  );

  return {
    token: createToken,
    user: createUser,
  };
};

const getUserProfileFromDB = async (
  user: JwtPayload,
): Promise<Partial<IUser>> => {
  const { id } = user;
  const isExistUser: any = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }
  return isExistUser;
};

const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>,
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

const switchProfileToDB = async (
  userId: string,
  role: USER_ROLES.USER | USER_ROLES.HOST,
) => {
  const user = await User.findById(userId);

  if (!user) throw new ApiError(404, "This user is not found in the database");

  if (![USER_ROLES.USER, USER_ROLES.HOST].includes(role))
    throw new ApiError(400, "Role is must be either 'USER' or 'HOST'");

  // if (role === USER_ROLES.HOST && user.hostStatus !== HOST_STATUS.APPROVED) {
  //   throw new ApiError(400, "User cannot switch to host before admin approval");
  // }

  const updatedUser = await User.findByIdAndUpdate(userId, { role }, { new: true });

  if (!updatedUser) throw new ApiError(400, "Failed to update role");

  const createToken = jwtHelper.createToken(
    {
      id: updatedUser._id,
      phone: updatedUser.phone,
      role: updatedUser.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string,
  );

  const result = {
    token: createToken,
    user: updatedUser,
  };

  return result;
};

const createHostRequestToDB = async (
  userId: string,
  payload: IHostRequestInput,
) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "No user is found for this ID");

  if (user.hostStatus === HOST_STATUS.APPROVED)
    throw new ApiError(400, "User is already a host");

  if (!payload.nidFrontPic || !payload.nidBackPic) {
    throw new ApiError(
      400,
      "Nid front picture and nid back picture is required",
    );
  }

  if (!payload.drivingLicenseFrontPic || !payload.drivingLicenseBackPic) {
    throw new ApiError(
      400,
      "Driving license front and back picture is required",
    );
  }

  user.nidFrontPic = payload.nidFrontPic;
  user.nidBackPic = payload.nidBackPic;
  if (payload.drivingLicenseFrontPic)
    user.drivingLicenseFrontPic = payload.drivingLicenseFrontPic;
  if (payload.drivingLicenseBackPic)
    user.drivingLicenseBackPic = payload.drivingLicenseBackPic;

  // host PENDING
  user.hostStatus = HOST_STATUS.PENDING;

  await user.save();

  return user;
};

const getAllHostRequestsFromDB = async (query: any) => {
  const baseQuery = User.find({
    hostStatus: {
      $in: [HOST_STATUS.PENDING, HOST_STATUS.APPROVED, HOST_STATUS.REJECTED],
    },
  });

  const queryBuilder = new QueryBuilder(baseQuery, query)
    .search(["firstName", "lastName", "fullName", "email", "phone"])
    .sort()
    .fields()
    .filter()
    .paginate();

  const hosts = await queryBuilder.modelQuery;

  const meta = await queryBuilder.countTotal();

  if (!hosts)
    throw new ApiError(404, "Host requests are not found in the database");

  return {
    data: hosts,
    meta,
  };
};

const getHostRequestByIdFromDB = async (id: string) => {
  const result = await User.findOne({
    _id: id,
    hostStatus: {
      $in: [HOST_STATUS.PENDING, HOST_STATUS.APPROVED, HOST_STATUS.REJECTED],
    },
  });

  if (!result)
    throw new ApiError(
      404,
      "No host request is found in the database by this ID",
    );

  return result;
};

const changeHostRequestStatusByIdFromDB = async (
  id: string,
  hostStatus: HOST_STATUS.PENDING | HOST_STATUS.APPROVED | HOST_STATUS.REJECTED,
) => {
  const user = await User.findOne({
    _id: id,
    hostStatus: {
      $in: [HOST_STATUS.PENDING, HOST_STATUS.APPROVED, HOST_STATUS.REJECTED],
    },
  });

  const userId = user?._id;

  if (!user) throw new ApiError(404, "No user is found host requst by this ID");

  const result = await User.findByIdAndUpdate(
    userId,
    { hostStatus },
    { new: true },
  );

  if (!result) throw new ApiError(404, "Failed to change host request status");

  return result;
};

const deleteHostRequestByIdFromDB = async (id: string) => {
  const user = await User.findById(id);
  console.log(user, "USER");

  if (!user) throw new ApiError(404, "No user is found by this ID");

  if (user?.hostStatus === HOST_STATUS.NONE)
    throw new ApiError(404, "No host request found by this ID");

  user.hostStatus = HOST_STATUS.NONE;
  user.nidFrontPic = "";
  user.nidBackPic = "";

  if (user.drivingLicenseFrontPic) user.drivingLicenseFrontPic = "";
  if (user.drivingLicenseBackPic) user.drivingLicenseBackPic = "";

  await user.save();

  return user;
};

const getAllUsersFromDB = async (query: any) => {
  const baseQuery = User.find({
    hostStatus: HOST_STATUS.NONE,
    role: USER_ROLES.USER,
  });

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
  };
};

const getUserByIdFromDB = async (id: string) => {
  const result = await User.findOne({
    _id: id,
    hostStatus: HOST_STATUS.NONE,
    role: USER_ROLES.USER,
  });

  if (!result)
    throw new ApiError(404, "No user is found in the database by this ID");

  return result;
};

const updateUserStatusByIdToDB = async (
  id: string,
  status: STATUS.ACTIVE | STATUS.INACTIVE,
) => {
  if (![STATUS.ACTIVE, STATUS.INACTIVE].includes(status)) {
    throw new ApiError(400, "Status must be either 'ACTIVE' or 'INACTIVE'");
  }

  const user = await User.findOne({
    _id: id,
    role: USER_ROLES.USER,
    hostStatus: HOST_STATUS.NONE,
  });
  if (!user) {
    throw new ApiError(404, "No user is found by this user ID");
  }

  const result = await User.findByIdAndUpdate(id, { status }, { new: true });
  if (!result) {
    throw new ApiError(400, "Failed to change status by this user ID");
  }

  return result;
};

const updateAdminStatusByIdToDB = async (
  id: string,
  status: STATUS.ACTIVE | STATUS.INACTIVE,
) => {
  if (![STATUS.ACTIVE, STATUS.INACTIVE].includes(status)) {
    throw new ApiError(400, "Status must be either 'ACTIVE' or 'INACTIVE'");
  }

  const user = await User.findOne({
    _id: id,
    role: USER_ROLES.ADMIN,
  });
  if (!user) {
    throw new ApiError(404, "No admin is found by this user ID");
  }

  const result = await User.findByIdAndUpdate(id, { status }, { new: true });
  if (!result) {
    throw new ApiError(400, "Failed to change status by this user ID");
  }

  return result;
};

const deleteUserByIdFromD = async (id: string) => {
  const user = await User.findOne({
    _id: id,
    hostStatus: HOST_STATUS.NONE,
    role: USER_ROLES.USER,
  });

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

// const getAllHostsFromDB = async (query: any) => {
//   const baseQuery = User.find({ hostStatus: HOST_STATUS.APPROVED });




//   const queryBuilder = new QueryBuilder(baseQuery, query)
//   .search(["firstName", "lastName", "fullName", "email", "phone"])
//   .sort()
//   .fields()
//   .filter()
//   .paginate();

//   const hosts = await queryBuilder.modelQuery;


//   const meta = await queryBuilder.countTotal();

//   if (!hosts) throw new ApiError(404, "No hosts are found in the database");

//   return {
//     data: hosts,
//     meta,
//   };
// };

const getAllHostsFromDB = async (query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const {
    searchTerm,
    sortBy = "createdAt",
    sortOrder = "desc",
    ...filters
  } = query;

  /* -------------------- MATCH (BASE FILTER) -------------------- */
  const matchStage: any = {
    hostStatus: HOST_STATUS.APPROVED,
  };

  /* -------------------- SEARCH -------------------- */
  if (searchTerm) {
    matchStage.$or = [
      { firstName: { $regex: searchTerm, $options: "i" } },
      { lastName: { $regex: searchTerm, $options: "i" } },
      { fullName: { $regex: searchTerm, $options: "i" } },
      { email: { $regex: searchTerm, $options: "i" } },
      { phone: { $regex: searchTerm, $options: "i" } },
    ];
  }

  /* -------------------- FILTER -------------------- */
  Object.keys(filters).forEach((key) => {
    if (
      !["page", "limit", "search", "sortBy", "sortOrder"].includes(key)
    ) {
      matchStage[key] = filters[key];
    }
  });

  /* -------------------- SORT -------------------- */
  const sortStage: any = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  /* -------------------- PIPELINE -------------------- */
  const pipeline: PipelineStage[] = [
    { $match: matchStage },

    /* Join cars */
    {
      $lookup: {
        from: "cars",
        localField: "_id",
        foreignField: "userId",
        as: "cars",
      },
    },

    /*  Filter cars + count */
    {
      $addFields: {
        cars: {
          $filter: {
            input: "$cars",
            as: "car",
            cond: {
              $and: [
                { $eq: ["$$car.verificationStatus", "APPROVED"] },
                { $eq: ["$$car.isActive", true] },
              ],
            },
          },
        },
        totalCars: {
          $size: {
            $filter: {
              input: "$cars",
              as: "car",
              cond: {
                $and: [
                  { $eq: ["$$car.verificationStatus", "APPROVED"] },
                  { $eq: ["$$car.isActive", true] },
                ],
              },
            },
          },
        },
      },
    },

    /* Sort */
    { $sort: sortStage },

    /*  Pagination */
    { $skip: skip },
    { $limit: limit },

    /*  Cleanup */
    {
      $project: {
        password: 0,
        __v: 0,
      },
    },
  ];

  const data = await User.aggregate(pipeline);

  /* -------------------- META COUNT -------------------- */
  const total = await User.countDocuments(matchStage);

  if (!data.length) {
    throw new ApiError(404, "No hosts found");
  }

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};

// const getHostByIdFromDB = async (id: string) => {
//   const result = await User.findOne({
//     _id: id,
//     hostStatus: HOST_STATUS.APPROVED,
//   });

//   if (!result)
//     throw new ApiError(404, "No host is found in the database by this ID");

//   return result;
// };

const getHostByIdFromDB = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid host ID");
  }

  const pipeline = [
    {
      $match: {
        _id: new Types.ObjectId(id),
        hostStatus: HOST_STATUS.APPROVED,
      },
    },

    /*  Join cars */
    {
      $lookup: {
        from: "cars",
        localField: "_id",
        foreignField: "userId",
        as: "cars",
      },
    },

    /* Filter approved + active cars */
    {
      $addFields: {
        cars: {
          $filter: {
            input: "$cars",
            as: "car",
            cond: {
              $and: [
                { $eq: ["$$car.verificationStatus", "APPROVED"] },
                { $eq: ["$$car.isActive", true] },
              ],
            },
          },
        },
        totalCars: {
          $size: {
            $filter: {
              input: "$cars",
              as: "car",
              cond: {
                $and: [
                  { $eq: ["$$car.verificationStatus", "APPROVED"] },
                  { $eq: ["$$car.isActive", true] },
                ],
              },
            },
          },
        },
      },
    },

    /*  Cleanup */
    {
      $project: {
        password: 0,
        __v: 0,
      },
    },
  ];

  const result = await User.aggregate(pipeline);

  if (!result.length) {
    throw new ApiError(404, "No host is found in the database by this ID");
  }

  return result[0];
};


const getHostDetailsByIdFromDB = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid host ID");
  }

  const pipeline: PipelineStage[] = [
    {
      $match: {
        _id: new Types.ObjectId(id),
        hostStatus: HOST_STATUS.APPROVED,
      },
    },
    /* Join Cars & Reviews */
    {
      $lookup: {
        from: "cars",
        localField: "_id",
        foreignField: "userId",
        as: "cars",
      },
    },
    {
      $lookup: {
        from: "reviews",
        let: { host_id: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$hostId", "$$host_id"] } } },
          { $sort: { createdAt: -1 } },
          {
            $lookup: {
              from: "users",
              localField: "fromUserId",
              foreignField: "_id",
              as: "fromUser"
            }
          },
          { $unwind: "$fromUser" },
          {
            $project: {
              reviewId: "$_id",
              ratingValue: 1,
              feedback: 1,
              fromUser: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                role: 1,
                email: 1,
                phone: 1,
                profileImage: 1,
              }
            }
          }
        ],
        as: "reviews",
      },
    },
    /*  Calculation Stage (Filter & Stats) */
    {
      $addFields: {
        cars: {
          $filter: {
            input: "$cars",
            as: "car",
            cond: {
              $and: [
                { $eq: ["$$car.verificationStatus", "APPROVED"] },
                { $eq: ["$$car.isActive", true] },
              ],
            },
          },
        },
        totalReviews: { $size: "$reviews" },
        averageRating: {
          $cond: [
            { $gt: [{ $size: "$reviews" }, 0] },
            { $round: [{ $avg: "$reviews.ratingValue" }, 1] },
            0
          ]
        },
        starCounts: {
          "1": { $size: { $filter: { input: "$reviews", as: "r", cond: { $eq: ["$$r.ratingValue", 1] } } } },
          "2": { $size: { $filter: { input: "$reviews", as: "r", cond: { $eq: ["$$r.ratingValue", 2] } } } },
          "3": { $size: { $filter: { input: "$reviews", as: "r", cond: { $eq: ["$$r.ratingValue", 3] } } } },
          "4": { $size: { $filter: { input: "$reviews", as: "r", cond: { $eq: ["$$r.ratingValue", 4] } } } },
          "5": { $size: { $filter: { input: "$reviews", as: "r", cond: { $eq: ["$$r.ratingValue", 5] } } } },
        }
      },
    },
    /*  Get total count of filtered cars */
    {
      $addFields: {
        totalCars: { $size: "$cars" }
      }
    },
    //  strict projection
    {
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        countryCode: 1,
        phone: 1,
        hostStatus: 1,
        location: 1,
        cars: 1,
        totalCars: 1,
        totalReviews: 1,
        averageRating: 1,
        starCounts: 1,
        reviews: 1,
      },
    },
  ];

  const result = await User.aggregate(pipeline);

  if (!result.length) {
    throw new ApiError(404, "No host is found in the database by this ID");
  }

  return result[0];
};

const updateHostStatusByIdToDB = async (
  id: string,
  status: STATUS.ACTIVE | STATUS.INACTIVE,
) => {
  if (![STATUS.ACTIVE, STATUS.INACTIVE].includes(status)) {
    throw new ApiError(400, "Status must be either 'ACTIVE' or 'INACTIVE'");
  }

  const host = await User.findOne({
    _id: id,
    hostStatus: HOST_STATUS.APPROVED,
  });
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
  updateAdminStatusByIdToDB,
  deleteUserByIdFromD,
  deleteProfileFromDB,
  getAllHostsFromDB,
  getHostByIdFromDB,
  updateHostStatusByIdToDB,
  getHostDetailsByIdFromDB,
};
