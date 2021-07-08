import { Schema, SchemaFactory, Prop } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type RefreshSessionDocument = RefreshSession & Document;

@Schema()
class RefreshSession {
  @Prop({ required: true, index: false, ref: "User" })
  userId: string;

  @Prop({ required: true, index: true })
  refreshToken: string;

  @Prop({ required: true, index: false })
  ip: string;

  @Prop({ required: true, index: true })
  userAgent: string;

  @Prop({ required: true, index: true })
  fingerprint: string;

  @Prop({ required: true, index: false })
  expiresIn: number;

  @Prop({ required: true, index: false })
  createdAt: number;
}

export const RefreshSessionSchema = SchemaFactory.createForClass(RefreshSession);
