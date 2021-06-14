// import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Schema } from 'mongoose';

// export type RefreshSessionDocument = RefreshSession & Document;
//
// @Schema()
// export class RefreshSession {
//   @Prop()
//   userId: string;
//
//   @Prop()
//   refreshToken: string;
//
//   @Prop()
//   userAgent: string;
//
//   @Prop()
//   ip: string;
//
//   @Prop()
//   expiresIn: number;
//
//   @Prop()
//   createdAt: number;
//
//   @Prop()
//   fingerprint: string;
// }
//
// export const RefreshSessionSchema = SchemaFactory.createForClass(RefreshSession);

export const RefreshSessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    expiresIn: {
      type: Number,
      required: true,
    },
    createdAt: {
      type: Number,
      required: true,
    },
    fingerprint: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
