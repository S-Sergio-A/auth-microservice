import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './services/auth.service';
import { RefreshSessionSchema } from './schemas/refreshSession.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'RefreshSession', schema: RefreshSessionSchema }])],
  providers: [AuthService]
})
export class AuthModule {}
