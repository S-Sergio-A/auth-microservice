import { Schema } from 'mongoose';
import validator from 'validator';

export const ForgotPasswordSchema = new Schema(
  {
    email: {
      type: String,
      required: true
    },
    verification: {
      type: String,
      validate: validator.isUUID,
      required: true
    },
    expires: {
      type: Number,
      required: true
    },
    ipOfRequest: {
      type: String,
      required: true
    },
    browserOfRequest: {
      type: String,
      required: true
    },
    countryOfRequest: {
      type: String,
      required: true
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
);
