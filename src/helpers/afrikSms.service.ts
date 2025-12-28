import axios from "axios";
import config from "../config";
import ApiError from "../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";

class AfrikSmsService {
  private baseUrl: string = "https://api.afriksms.com/api/web/web_v1/outbounds";

  private formatPhoneNumber(phone: string, countryCode: string): string {
    let cleanCode = countryCode.replace(/\+/g, "").replace(/^00/, "");
    let cleanPhone = phone.trim().replace(/\s+/g, "");

    if (cleanPhone.startsWith("0")) {
      cleanPhone = cleanPhone.substring(1);
    }

    if (cleanPhone.startsWith(cleanCode)) {
      return cleanPhone;
    }

    return `${cleanCode}${cleanPhone}`;
  }

  // numeric OTP return korbe (apnar interface-e number type)
  public generateOTP(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  async sendSMS(phoneNumber: string, countryCode: string, message: string): Promise<any> {
    try {
      const mobileNumbers = this.formatPhoneNumber(phoneNumber, countryCode);

      const params = {
        ClientId: config.afrikSms.clientId,
        ApiKey: config.afrikSms.apiKey,
        SenderId: config.afrikSms.senderId,
        Message: message,
        MobileNumbers: mobileNumbers,
      };

      const response = await axios.get(`${this.baseUrl}/send`, { params });

      if (response.data.code === 100) {
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to send SMS");
      }
    } catch (error: any) {
      throw new ApiError(
        StatusCodes.EXPECTATION_FAILED,
        `SMS failed: ${error.message}`
      );
    }
  }
}

export const afrikSmsService = new AfrikSmsService();