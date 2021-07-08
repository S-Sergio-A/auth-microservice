import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ForgotPasswordDocument = ForgotPassword & Document;

@Schema()
class ForgotPassword {
  @Prop({ required: true, index: true })
  email: string;

  @Prop({ required: true, index: true })
  verification: string;

  @Prop({ required: true, index: false })
  expires: number;

  @Prop({ required: true, index: false })
  ipOfRequest: string;

  @Prop({ required: true, index: false })
  browserOfRequest: string;

  @Prop({ required: true, index: false })
  countryOfRequest: string;
}

export const ForgotPasswordSchema = SchemaFactory.createForClass(ForgotPassword);
