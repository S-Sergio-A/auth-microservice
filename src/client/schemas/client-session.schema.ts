import { Schema, SchemaFactory, Prop } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ClientSessionDocument = ClientSession & Document;

@Schema()
class ClientSession {
  @Prop({ required: true, index: true })
  clientId: string;

  @Prop({ required: true, index: false })
  ip: string;

  @Prop({ required: true, index: false })
  userAgent: string;

  @Prop({ required: true, index: true })
  fingerprint: string;
}

export const ClientSessionSchema = SchemaFactory.createForClass(ClientSession);
