import { MongooseModule } from "@nestjs/mongoose";
import { Module } from "@nestjs/common";
import { ClientHandlers } from "~/modules/client/client-handlers.service";
import { ClientExecutor } from "~/modules/client/client-executor.service";
import { ClientService } from "./client.service";
import { TokenModule } from "~/modules/token/token.module";
import { ClientSession, ConnectionNamesEnum, ContactForm, ModelsNamesEnum } from "@ssmovzh/chatterly-common-utils";

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        {
          name: ModelsNamesEnum.CONTACT_FORMS,
          schema: ContactForm
        }
      ],
      ConnectionNamesEnum.USERS
    ),
    MongooseModule.forFeature(
      [
        {
          name: ModelsNamesEnum.CLIENT_SESSIONS,
          schema: ClientSession
        }
      ],
      ConnectionNamesEnum.CLIENTS
    ),
    TokenModule
  ],
  providers: [ClientService, ClientHandlers, ClientExecutor],
  exports: [ClientService, ClientHandlers, ClientExecutor]
})
export class ClientModule {}
