import { Model } from 'mongoose';
import { GENDER, HOST_STATUS, STATUS, USER_ROLES } from '../../../enums/user';


export type IUser = {
    firstName: string;
    lastName: string;
    role: USER_ROLES;
    countryCode: string;
    phone: string;
    email?: string;
    profileImage?: string;
    nidFrontPic: string;
    nidBackPic: string;
    hostStatus: HOST_STATUS;
    drivingLicenseFrontPic?: string;
    drivingLicenseBackPic?: string;
    password: string;
    dateOfBirth: string;
    gender?: GENDER;
    verified: boolean;
    status: STATUS;
    location?: {
        type: "Point";
        coordinates: [number, number]; // [longitude, latitude],
    };
    authentication?: {
        isResetPassword: boolean;
        oneTimeCode: number;
        expireAt: Date;
    };
};

export interface IHostRequestInput {
    nidFrontPic: string;
    nidBackPic: string;
    drivingLicenseFrontPic?: string;
    drivingLicenseBackPic?: string;
}

export type UserModal = {
    isExistUserById(id: string): any;
    isExistUserByEmail(email: string): any;
    isAccountCreated(id: string): any;
    isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;