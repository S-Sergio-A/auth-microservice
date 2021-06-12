import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {AuthenticationController} from "./authentication-service/auth/controllers/user.controller";
import {AuthenticationService} from "./authentication-service/auth/services/user.service";
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [MongooseModule.forRoot(process.env.MONGO_URL)],
  controllers: [AppController, AuthenticationController],
  providers: [AppService, AuthenticationService]
})
export class AppModule {}
