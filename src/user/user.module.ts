import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { ValidationModule } from '../pipes/validation.module';
import { AuthModule } from '../auth/auth.module';
import { ForgotPasswordSchema } from './schemas/forgot-password.schema';
import { VaultSchema } from './schemas/vault.schema';
import { UserSchema } from './schemas/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    MongooseModule.forFeature([{ name: 'ForgotPassword', schema: ForgotPasswordSchema }]),
    MongooseModule.forFeature([{ name: 'Vault', schema: VaultSchema }]),
    AuthModule,
    ValidationModule
  ],
  controllers: [UserController],
  providers: [UserService]
})

export class UserModule {}
