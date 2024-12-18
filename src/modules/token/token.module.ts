import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TokenService } from "./token.service";
import { ModelsNamesEnum, RefreshSessionSchema } from "@ssmovzh/chatterly-common-utils";

@Module({
  imports: [MongooseModule.forFeature([{ name: ModelsNamesEnum.REFRESH_SESSIONS, schema: RefreshSessionSchema }])],
  providers: [TokenService],
  exports: [TokenService]
})
export class TokenModule {}
