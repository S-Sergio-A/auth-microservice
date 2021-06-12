import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document} from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop()
  birthday: Date;
  
  @Prop()
  email: number;
  
  @Prop()
  firstName: string;
  
  @Prop()
  lastName: string;
  
  @Prop()
  password: string;
  
  @Prop()
  passwordVerification: string;
  
  @Prop()
  phoneNumber: string;
  
  @Prop()
  username: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
