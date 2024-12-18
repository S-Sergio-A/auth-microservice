import { MongooseModule } from "@nestjs/mongoose";
import { Module } from "@nestjs/common";
import { ClientHandlers } from "~/modules/client/client-handlers.service";
import { ClientExecutor } from "~/modules/client/client-executor.service";
import { ClientService } from "./client.service";
import { TokenModule } from "~/modules/token/token.module";
import { ClientSessionSchema, ContactFormSchema, ModelsNamesEnum } from "@ssmovzh/chatterly-common-utils";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ModelsNamesEnum.CONTACT_FORMS,
        schema: ContactFormSchema
      }
    ]),
    MongooseModule.forFeature([
      {
        name: ModelsNamesEnum.CLIENT_SESSIONS,
        schema: ClientSessionSchema
      }
    ]),
    TokenModule
  ],
  providers: [ClientService, ClientHandlers, ClientExecutor],
  exports: [ClientService, ClientHandlers, ClientExecutor]
})
export class ClientModule {}
