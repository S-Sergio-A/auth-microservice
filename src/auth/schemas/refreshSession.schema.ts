import { Schema } from 'mongoose';

export const RefreshSessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    refreshToken: {
      type: String,
      required: true
    },
    ip: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      required: true
    },
    expiresIn: {
      type: Number,
      required: true
    },
    createdAt: {
      type: Number,
      required: true
    },
    fingerprint: {
      type: String,
      required: true
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
);
