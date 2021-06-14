import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationController } from './controllers/user.controller';
import { TokenService } from './services/token.service';
import { UserService } from './services/user.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  RefreshSession,
  RefreshSessionSchema,
} from './schemas/refreshSession.schema';
import { User, UserSchema } from './schemas/user.schema';
import {APP_GUARD} from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 300,
      limit: 10,
      ignoreUserAgents: [
        new RegExp('googlebot', 'gi'),
        new RegExp('bingbot', 'gi'),
      ]
    }),
    MongooseModule.forRoot('mongodb://localhost/auth'),
    MongooseModule.forFeature([
      { name: RefreshSession.name, schema: RefreshSessionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AppController, AuthenticationController],
  providers: [
    AppService,
    UserService,
    TokenService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
