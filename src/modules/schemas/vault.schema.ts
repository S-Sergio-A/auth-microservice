import { Schema, SchemaFactory, Prop } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type VaultDocument = Vault & Document;

@Schema()
class Vault {
  @Prop({ required: true, index: true, ref: "User", type: Types.ObjectId })
  user: Types.ObjectId;

  @Prop({ required: true, index: true })
  salt: string;
}

export const VaultSchema = SchemaFactory.createForClass(Vault);
