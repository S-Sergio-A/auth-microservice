import { MongooseModule } from "@nestjs/mongoose";
import { Module } from "@nestjs/common";
import {
  ConnectionNamesEnum,
  HealthCheckModule,
  LoggerModule,
  MongoConfigInterface,
  TokenConfigInterface
} from "@ssmovzh/chatterly-common-utils";
import { defaultImports } from "~/modules/common";
import { RabbitModule } from "~/modules/rabbit";
import { TokenModule } from "~/modules/token/token.module";
import { UserModule } from "~/modules/user/user.module";
import { ClientModule } from "~/modules/client/client.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    ...defaultImports,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const { secret, expiresIn } = configService.get<TokenConfigInterface>("jwt");
        return {
          secret,
          signOptions: { expiresIn }
        };
      },
      global: true
    }),
    TokenModule,
    UserModule,
    ClientModule,
    RabbitModule,
    HealthCheckModule,
    LoggerModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const mongoConfig = configService.get<MongoConfigInterface>("mongoConfig");
        return {
          uri: `mongodb+srv://${mongoConfig.username}:${mongoConfig.password}@${mongoConfig.clusterUrl}/${ConnectionNamesEnum.CHATTERLY}?retryWrites=true&w=majority&appName=Cluster0`
        };
      },
      inject: [ConfigService]
    })
  ]
})
export class AppModule {}
