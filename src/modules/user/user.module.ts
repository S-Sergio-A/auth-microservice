import { MongooseModule } from "@nestjs/mongoose";
import { Module } from "@nestjs/common";
import { TokenModule } from "../token/token.module";
import { UserService } from "./user.service";
import { UserHandlers } from "~/modules/user/user-handlers.service";
import { UserExecutor } from "~/modules/user/user-executor.service";
import { ChangePrimaryDataSchema, ForgotPasswordSchema, ModelsNamesEnum, UserSchema, VaultSchema } from "@ssmovzh/chatterly-common-utils";
import { MessagePublisherService } from "~/modules/user/message-publisher.service";
import { RabbitProducerService } from "~/modules/user/rabbit-producer.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ModelsNamesEnum.USERS, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: ModelsNamesEnum.VAULTS, schema: VaultSchema }]),
    MongooseModule.forFeature([
      {
        name: ModelsNamesEnum.FORGOT_PASSWORDS,
        schema: ForgotPasswordSchema
      }
    ]),
    MongooseModule.forFeature([
      {
        name: ModelsNamesEnum.CHANGE_PRIMARY_DATA,
        schema: ChangePrimaryDataSchema
      }
    ]),
    TokenModule
  ],
  providers: [UserService, UserHandlers, UserExecutor, MessagePublisherService, RabbitProducerService],
  exports: [UserService, UserHandlers, UserExecutor, MessagePublisherService, RabbitProducerService]
})
export class UserModule {}
