import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { CarServices } from "./car.service";

const createCar = catchAsync(async (req, res) => {
    const { id: userId } = req.user;

    const carData = req.body;

    const result = await CarServices.createCarToDB(userId, carData);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Successfully created a car",
        data: result,
    })

})

const getAllCars = catchAsync(async (req, res) => {
    const result = await CarServices.getAllCarsFromDB();

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Cars data are retrieved successfully",
        data: result,
    })

})

const getOwnCars = catchAsync(async (req, res) => {
    const { id: userId } = req.user;

    const result = await CarServices.getOwnCarsFromDB(userId);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Own cars data are retrieved successfully",
        data: result,
    })

})

const getCarById = catchAsync(async (req, res) => {

    const { id } = req.params;

    const result = await CarServices.getCarByIdFromDB(id);
    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Car data is retrieved successfully",
        data: result,
    })

})

const updateCarById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const { id: userId } = req.user;

    const updatedPayload = req.body;

    const result = await CarServices.updateCarByIdToDB(userId, id, updatedPayload);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Car data is updated successfully",
        data: result,
    })

})

const deleteCarById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { id: userId } = req.user;

    const result = await CarServices.deleteCarByIdFromDB(userId, id);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Car data is deleted successfully",
        data: result,
    })

})

export const CarControllers = {
    createCar,
    getAllCars,
    getOwnCars,
    getCarById,
    updateCarById,
    deleteCarById,
}