import { MongooseModule } from "@nestjs/mongoose";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ForgotPasswordSchema } from "./schemas/forgot-password.schema";
import { VaultSchema } from "./schemas/vault.schema";
import { UserSchema } from "./schemas/user.schema";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "User", schema: UserSchema }]),
    MongooseModule.forFeature([{ name: "Vault", schema: VaultSchema }]),
    MongooseModule.forFeature([{ name: "Forgot-Password", schema: ForgotPasswordSchema }]),
    AuthModule
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
