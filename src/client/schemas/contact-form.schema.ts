import { Schema, SchemaFactory, Prop } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ContactFormDocument = ContactForm & Document;

@Schema()
class ContactForm {
  @Prop({ required: true, index: true })
  id: string;

  @Prop({ required: true, index: false })
  clientEmail: string;

  @Prop({ required: true, index: false })
  clientFullName: string;

  @Prop({ required: true, index: false })
  subject: string;

  @Prop({ required: true, index: true })
  message: string;

  @Prop({ required: true, index: false })
  createdAt: number;
}

export const ContactFormSchema = SchemaFactory.createForClass(ContactForm);
