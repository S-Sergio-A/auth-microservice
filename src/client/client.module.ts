import { MongooseModule } from "@nestjs/mongoose";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ClientSessionSchema } from "./schemas/client-session.schema";
import { ContactFormSchema } from "./schemas/contact-form.schema";
import { ClientController } from "./client.controller";
import { ClientService } from "./client.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Contact-Form", schema: ContactFormSchema }]),
    MongooseModule.forFeature([{ name: "Client-Session", schema: ClientSessionSchema }]),
    AuthModule
  ],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService]
})
export class ClientModule {}
