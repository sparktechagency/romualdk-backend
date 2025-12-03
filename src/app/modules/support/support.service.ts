import { Types } from "mongoose";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { emailHelper } from "../../../helpers/emailHelper";
import { ISendEmail } from "../../../types/email";
import { User } from "../user/user.model";
import { TSupport } from "./support.interface";
import { Support } from "./support.model";
import QueryBuilder from "../../builder/queryBuilder";

const support = async (id: string, payload: TSupport) => {
  const user = await User.isExistUserById(id);

  if (!user) {
    throw new ApiError(404, "No user is found in the database");
  }

  payload.userId = new Types.ObjectId(id);
  

  const supportEntry = await Support.create(payload);

  const emailPayload: ISendEmail = {
    to: config.support_receiver_email || "support@yourdomain.com", // Admin email
    subject: `Support Request: ${payload.subject}`,
    html: `
  <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.05)">
    <div style="background-color:#1a1c1e;padding:20px;color:white;text-align:center">
      <h2 style="margin:0;font-size:24px">FomoGigs - Support Request</h2>
    </div>
    <div style="padding:20px;background-color:#ffffff">
      <p style="font-size:16px;margin-bottom:10px;"><strong>Requester Name:</strong> ${user.fullName}</p>
      <p style="font-size:16px;margin-bottom:10px;"><strong>Requester Email:</strong> ${payload.email}</p>
      <p style="font-size:16px;margin-bottom:10px;"><strong>Subject:</strong> ${payload.subject}</p>
      <div style="margin-top:20px">
        <p style="font-size:16px;margin-bottom:5px;"><strong>Message:</strong></p>
        <div style="background-color:#f9f9f9;padding:15px;border-left:4px solid #1a1c1e;border-radius:4px;font-size:15px;line-height:1.6">
          ${payload.message}
        </div>
      </div>
      <div style="text-align:center;margin-top:30px">
        <a href="mailto:${payload.email}" style="background-color:#1a1c1e;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-size:16px;display:inline-block">
          Reply to ${user.fullName}
        </a>
      </div>
    </div>
    <div style="background-color:#f2f2f2;padding:15px;text-align:center;font-size:12px;color:#888;">
      © ${new Date().getFullYear()} FomoGigs. All rights reserved.
    </div>
  </div>
`,
  };

  await emailHelper.sendEmail(emailPayload);

  return supportEntry;
};

const getAllSupportsFromDB = async (query: any) => {
  const baseQuery = Support.find();

  const queryBuilder = new QueryBuilder(baseQuery, query)
    .search(["name email subject userId"])
    .sort()
    .fields()
    .filter()
    .paginate();

  const supports = await queryBuilder.modelQuery;

  const meta = await queryBuilder.countTotal();

  if (!supports || supports.length === 0) {
    throw new ApiError(404, "Supports data are not found in the database");
  }

  return {
    data: supports,
    meta,
  };
};

const getSupportByIdFromDB = async (id: string) => {
  const support = await Support.findById(id);

  if (!support) {
    throw new ApiError(404, "No support is found by this ID");
  }

  return support;
};

const deleteSupportByIdFromDB = async (id: string) => {
  const support = await Support.findByIdAndDelete(id);
  if (!support) {
    throw new ApiError(400, "Failed to delete this support by this ID");
  }

  return support;
};

export const SupportServices = {
  support,
  getAllSupportsFromDB,
  getSupportByIdFromDB,
  deleteSupportByIdFromDB,
};
