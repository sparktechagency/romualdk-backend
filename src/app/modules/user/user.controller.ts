import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { UserService } from "./user.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { JwtPayload } from "jsonwebtoken";
import config from "../../../config";

// register user
const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ...userData } = req.body;

    console.log(userData, "payload");

    const result = await UserService.createUserToDB(userData);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message:
        "Your account has been successfully created. Verify Your Email By OTP. Check your email",
      data: result,
    });
  },
);

// register admin
const createAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ...userData } = req.body;
    const result = await UserService.createAdminToDB(userData);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Admin created successfully",
      data: result,
    });
  },
);

const getAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAdminFromDB(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Admin retrieved Successfully",
    data: result,
  });
});

const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const payload = req.params.id;
  const result = await UserService.deleteAdminFromDB(payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Admin Deleted Successfully",
    data: result,
  });
});

// retrieved user profile
const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await UserService.getUserProfileFromDB(user as JwtPayload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Profile data retrieved successfully",
    data: result,
  });
});

//update profile
const updateProfile = catchAsync(async (req, res) => {
  const user: any = req.user;
  if ("role" in req.body) {
    delete req.body.role;
  }
  if ("phone" in req.body) {
    delete req.body.phone;
  }
  // If password is provided
  if (req.body.password) {
    req.body.password = await bcrypt.hash(
      req.body.password,
      Number(config.bcrypt_salt_rounds),
    );
  }

  const result = await UserService.updateProfileToDB(user, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Profile updated successfully",
    data: result,
  });
});

const switchProfile = catchAsync(async (req, res) => {
  const { role } = req.body;
  const { id: userId } = req.user;
  const result = await UserService.switchProfileToDB(userId, role);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Successfully switch the accounts",
    data: result,
  });
});

const createHostRequest = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const data = req.body;
  const result = await UserService.createHostRequestToDB(userId, data);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Successfully host requst send",
    data: result,
  });
});

const getAllHostRequests = catchAsync(async (req, res) => {
  const result = await UserService.getAllHostRequestsFromDB(req.query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Successfully retrieved are host requests data",
    data: result,
  });
});

const getHostRequestById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserService.getHostRequestByIdFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Successfully retrieve host by ID",
    data: result,
  });
});

const changeHostRequestStatusById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { hostStatus } = req.body;

  const result = await UserService.changeHostRequestStatusByIdFromDB(
    id,
    hostStatus,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Successfully change host status by ID",
    data: result,
  });
});

const deleteHostRequestById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserService.deleteHostRequestByIdFromDB(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Successfully delete host request by this ID",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req, res) => {
  const result = await UserService.getAllUsersFromDB(req.query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Successfully retrieved are users data",
    data: result,
  });
});

const getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserService.getUserByIdFromDB(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Successfully retrieve user by ID",
    data: result,
  });
});

const updateUserStatusById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const { status } = req.body;

  const result = await UserService.updateUserStatusByIdToDB(id, status);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Status updated successfully",
    data: result,
  });
});

const updateAdminStatusById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const { status } = req.body;

  const result = await UserService.updateAdminStatusByIdToDB(id, status);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Admin status updated successfully",
    data: result,
  });
});

const deleteUserById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await UserService.deleteUserByIdFromD(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User is deleted successfully",
    data: result,
  });
});

const deleteProfile = catchAsync(async (req, res) => {
  const { id: userId } = req.user;

  const result = await UserService.deleteProfileFromDB(userId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Successfully delete your account",
    data: result,
  });
});

const getAllHosts = catchAsync(async (req, res) => {
  const result = await UserService.getAllHostsFromDB(req.query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Successfully retrieved are hosts data",
    data: result,
  });
});

const getHostById = catchAsync(async (req, res) => {
  const { id } = req.params;
  console.log(id, "ID");
  const result = await UserService.getHostByIdFromDB(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Successfully retrieve host by ID",
    data: result,
  });
});

const updateHostStatusById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const { status } = req.body;

  const result = await UserService.updateHostStatusByIdToDB(id, status);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Host status updated successfully",
    data: result,
  });
});

export const UserController = {
  createUser,
  createAdmin,
  getAdmin,
  deleteAdmin,
  getUserProfile,
  updateProfile,
  switchProfile,
  createHostRequest,
  getAllHostRequests,
  getHostRequestById,
  changeHostRequestStatusById,
  deleteHostRequestById,
  getAllUsers,
  getUserById,
  updateUserStatusById,
  updateAdminStatusById,
  deleteUserById,
  deleteProfile,
  getAllHosts,
  getHostById,
  updateHostStatusById,
};
