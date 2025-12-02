import { Types } from "mongoose";

export enum AVAILABLE_DAYS {
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
}

export enum FUEL_TYPE {
  PETROL = "PETROL",
  DISEL = "DISEL",
  ELECTRIC = "ELECTRIC",
  HYBRID = "HYBRID"
}

export enum TRANSMISSION {
  MANUAL = "MANUAL",
  AUTOMATIC = "AUTOMATIC"
}

export interface ICar {
  userId: Types.ObjectId;
  brand: string;
  model: string;
  year: number;
  transmission: TRANSMISSION;
  fuelType: FUEL_TYPE;
  airConditioning: string;
  gpsNavigation: string;
  mileage: string;
  bluetooth: string;
  seatNumber: number;
  color: string;
  about: string;
  shortDescription: string;
  licensePlate: string;
  carRegistration: { frontImage: string; backImage: string };
  photos: string[];
  dailyPrice: number;
  hourlyPrice?: number;
  minimumTripDuration: number; // in hours
  withDriver: boolean;
  city: string;
  pickupPoint: { type: "Point"; coordinates: [number, number] };
  availableDays: AVAILABLE_DAYS[];
  defaultStartTime?: string; // e.g., "09:00"
  defaultEndTime?: string;   // e.g., "21:00"
  isActive: boolean;
}