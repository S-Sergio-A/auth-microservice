import { Schema } from 'mongoose';

export const VaultSchema = new Schema(
  {
    userId: {
      type: String,
      required: true
    },
    salt: {
      type: String,
      required: true
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
);
