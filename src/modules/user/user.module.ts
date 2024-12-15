import { MongooseModule } from "@nestjs/mongoose";
import { Module } from "@nestjs/common";
import { TokenModule } from "../token/token.module";
import { UserService } from "./user.service";
import { UserHandlers } from "~/modules/user/user-handlers.service";
import { UserExecutor } from "~/modules/user/user-executor.service";
import { ChangePrimaryData, ConnectionNamesEnum, ForgotPassword, ModelsNamesEnum, User, Vault } from "@ssmovzh/chatterly-common-utils";
import { MessagePublisherService } from "~/modules/user/message-publisher.service";
import { RabbitProducerService } from "~/modules/user/rabbit-producer.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ModelsNamesEnum.USERS, schema: User }], ConnectionNamesEnum.USERS),
    MongooseModule.forFeature([{ name: ModelsNamesEnum.VAULT, schema: Vault }], ConnectionNamesEnum.USERS),
    MongooseModule.forFeature(
      [
        {
          name: ModelsNamesEnum.FORGOT_PASSWORD,
          schema: ForgotPassword
        }
      ],
      ConnectionNamesEnum.USERS
    ),
    MongooseModule.forFeature(
      [
        {
          name: ModelsNamesEnum.CHANGE_PRIMARY_DATA,
          schema: ChangePrimaryData
        }
      ],
      ConnectionNamesEnum.USERS
    ),
    TokenModule
  ],
  providers: [UserService, UserHandlers, UserExecutor, MessagePublisherService, RabbitProducerService],
  exports: [UserService, UserHandlers, UserExecutor, MessagePublisherService, RabbitProducerService]
})
export class UserModule {}
