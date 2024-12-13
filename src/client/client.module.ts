import { MongooseModule } from "@nestjs/mongoose";
import { Module } from "@nestjs/common";
import { TokenModule } from "../token/token.module";
import { ClientSessionSchema } from "~/modules/schemas/client-session.schema";
import { ContactFormSchema } from "~/modules/schemas/contact-form.schema";
import { ClientController } from "./client.controller";
import { ClientService } from "./client.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Contact-Form", schema: ContactFormSchema }]),
    MongooseModule.forFeature([{ name: "Client-Session", schema: ClientSessionSchema }]),
    TokenModule
  ],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService]
})
export class ClientModule {}
