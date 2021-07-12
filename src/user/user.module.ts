import { MongooseModule } from "@nestjs/mongoose";
import { Module } from "@nestjs/common";
import { TokenModule } from "../token/token.module";
import { ChangePrimaryDataSchema } from "./schemas/change-primary-data.schema";
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
    MongooseModule.forFeature([{ name: "Change-Primary-Data", schema: ChangePrimaryDataSchema }]),
    TokenModule
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
