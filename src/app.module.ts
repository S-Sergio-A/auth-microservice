import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";
import { UserController } from "./user/user.controller";
import { ClientModule } from "./client/client.module";
import { TokenModule } from "./token/token.module";
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${process.env.MONGO_DATABASE_NAME}?retryWrites=true&w=majority`
    ),
    TokenModule,
    UserModule,
    ClientModule
  ],
  controllers: [UserController]
})
export class AppModule {}
