import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './services/auth.service';
import { RefreshSessionSchema } from './schemas/refreshSession.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Refresh-Session', schema: RefreshSessionSchema }])],
  providers: [AuthService],
  exports: [AuthService]
})
export class AuthModule {}
