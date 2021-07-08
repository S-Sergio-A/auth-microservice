import { Schema, SchemaFactory, Prop } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type VaultDocument = Vault & Document;

@Schema()
class Vault {
  @Prop({ required: true, index: true, ref: "User" })
  userId: string;

  @Prop({ required: true, index: true })
  salt: string;
}

export const VaultSchema = SchemaFactory.createForClass(Vault);
