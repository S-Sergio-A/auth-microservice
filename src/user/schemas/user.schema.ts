import { Schema, SchemaFactory, Prop } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserDocument = User & Document;

@Schema()
class User {
  @Prop({ required: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  email: string;

  @Prop({ required: true, index: true })
  username: string;

  @Prop({ required: true, index: true })
  password: string;

  @Prop({ required: true, index: true })
  phoneNumber: string;

  @Prop({ required: false, index: false })
  firstName: string;

  @Prop({ required: false, index: false })
  lastName: string;

  @Prop({ required: false, index: false })
  birthday: string;

  @Prop({ required: true, index: true })
  verification: string;

  @Prop({ required: false, index: false })
  isActive: boolean;

  @Prop({ required: false, index: false })
  isBlocked: boolean;

  @Prop({ required: false, index: false })
  verificationExpires: number;

  @Prop({ required: false, index: false })
  loginAttempts: number;

  @Prop({ required: false, index: false })
  blockExpires: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
