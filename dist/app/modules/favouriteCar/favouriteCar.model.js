"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavouriteCar = void 0;
const mongoose_1 = require("mongoose");
const favouriteCarSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    referenceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "Event",
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.FavouriteCar = (0, mongoose_1.model)("FavouriteCar", favouriteCarSchema);
