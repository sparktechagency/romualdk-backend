import { model, Schema } from "mongoose";
import { IMedia, MEDIA_TYPE } from "./media.interface";

const mediaSchema = new Schema<IMedia>(
<<<<<<< HEAD
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      required: true,
    },

    status: {
      type: Boolean,
      default: true,
    },

    type: {
      type: String,
      enum: Object.values(MEDIA_TYPE), // ["BANNER", "FEED"]
      required: true,
    },

    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
=======
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        image: {
            type: String,
            required: true,
        },

        status: {
            type: Boolean,
            default: true,
        },

        type: {
            type: String,
            enum: Object.values(MEDIA_TYPE), // ["BANNER", "FEED"]
            required: true,
        },

        description: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
>>>>>>> clean-payment
);

// for best performance
mediaSchema.index({ type: 1, description: 1 });

<<<<<<< HEAD
export const Media = model<IMedia>("Media", mediaSchema);
=======

export const Media = model<IMedia>("Media", mediaSchema);
>>>>>>> clean-payment
