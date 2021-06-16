import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationController } from './controllers/user.controller';
import { TokenService } from './services/token/token.service';
import { UserService } from './services/user/user.service';
import { RefreshSessionSchema } from './schemas/refreshSession.schema';
import { UserSchema } from './schemas/user.schema';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 300,
      limit: 10,
      ignoreUserAgents: [new RegExp('googlebot', 'gi'), new RegExp('bingbot', 'gi')]
    }),
    MongooseModule.forRoot('mongodb://localhost/auth'),
    MongooseModule.forFeature([
      { name: 'RefreshSessionSchema', schema: RefreshSessionSchema },
      { name: 'UserSchema', schema: UserSchema }
    ])
  ],
  controllers: [AuthenticationController],
  providers: [
    UserService,
    TokenService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}
