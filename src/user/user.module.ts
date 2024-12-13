import { MongooseModule } from "@nestjs/mongoose";
import { Module } from "@nestjs/common";
import { TokenModule } from "../token/token.module";
import { ChangePrimaryDataSchema } from "../modules/schemas/change-primary-data.schema";
import { ForgotPasswordSchema } from "../modules/schemas/forgot-password.schema";
import { VaultSchema } from "../modules/schemas/vault.schema";
import { UserSchema } from "../modules/schemas/user.schema";
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
