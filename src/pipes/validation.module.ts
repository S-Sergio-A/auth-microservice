import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { UserSchema } from '../user/schemas/user.schema';
import { UserModule } from '../user/user.module';
import { ValidationService } from './validation/validation.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'UserSchema', schema: UserSchema }]), UserModule],
  providers: [ValidationService],
  exports: [ValidationService]
})
export class ValidationModule {}
