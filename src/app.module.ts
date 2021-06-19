import { forwardRef, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { ClientAuthMiddleware } from './middlewares/user.authentication.middleware';
import { RefreshSessionSchema } from './auth/schemas/refreshSession.schema';
import { ValidationService } from './pipes/validation/validation.service';
import { UserController } from './user/user.controller';
import { ValidationModule } from './pipes/validation.module';
import { UserService } from './user/user.service';
import { AuthService } from './auth/services/auth.service';
import { UserSchema } from './user/schemas/user.schema';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 300,
      limit: 10,
      ignoreUserAgents: [new RegExp('googlebot', 'gi'), new RegExp('bingbot', 'gi')]
    }),
    MongooseModule.forRoot('mongodb://localhost/user'),
    MongooseModule.forFeature([
      { name: 'RefreshSessionSchema', schema: RefreshSessionSchema },
      { name: 'UserSchema', schema: UserSchema }
    ]),
    AuthModule,
    forwardRef(() => UserModule),
    forwardRef(() => ValidationModule)
  ],
  controllers: [UserController],
  providers: [
    UserService,
    AuthService,
    ValidationService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ClientAuthMiddleware).forRoutes(UserController);
  }
}
