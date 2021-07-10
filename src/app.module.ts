import { Module } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ValidationModule } from "./pipes/validation.module";
import { UserController } from "./user/user.controller";
import { ClientModule } from "./client/client.module";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${process.env.MONGO_DATABASE_NAME}?retryWrites=true&w=majority`
    ),
    ThrottlerModule.forRoot({
      ttl: 300,
      limit: 10,
      ignoreUserAgents: [new RegExp("googlebot", "gi"), new RegExp("bingbot", "gi")]
    }),
    ValidationModule,
    AuthModule,
    UserModule,
    ClientModule
  ],
  controllers: [UserController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}

// TODO public API, REDIS microservices (auth, entrance, client, email verification, rooms), test, push to heroku, FRONT
