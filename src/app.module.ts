import { MongooseModule } from "@nestjs/mongoose";
import { Module } from "@nestjs/common";
import { ConnectionNamesEnum, HealthCheckModule, LoggerModule } from "@ssmovzh/chatterly-common-utils";
import { defaultImports } from "~/modules/common";
import { RabbitModule } from "~/modules/rabbit";
import { TokenModule } from "~/modules/token/token.module";
import { UserModule } from "~/modules/user/user.module";
import { ClientModule } from "~/modules/client/client.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Module({
  imports: [
    ...defaultImports,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: () => ({
        secret: process.env.JWT_SECRET_KEY,
        signOptions: { expiresIn: process.env.JWT_EXPIRATION_TIME }
      }),
      global: true
    }),
    TokenModule,
    UserModule,
    ClientModule,
    RabbitModule,
    HealthCheckModule,
    LoggerModule,
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${ConnectionNamesEnum.USERS}?retryWrites=true&w=majority`,
      {
        connectionName: ConnectionNamesEnum.USERS
      }
    ),
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${ConnectionNamesEnum.ROOMS}?retryWrites=true&w=majority`,
      {
        connectionName: ConnectionNamesEnum.ROOMS
      }
    ),
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${ConnectionNamesEnum.MESSAGES}?retryWrites=true&w=majority`,
      {
        connectionName: ConnectionNamesEnum.MESSAGES
      }
    ),
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${ConnectionNamesEnum.CLIENTS}?retryWrites=true&w=majority`,
      {
        connectionName: ConnectionNamesEnum.CLIENTS
      }
    )
  ]
})
export class AppModule {}
