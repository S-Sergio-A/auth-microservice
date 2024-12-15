import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TokenService } from "./token.service";
import { ConnectionNamesEnum, ModelsNamesEnum, RefreshSession } from "@ssmovzh/chatterly-common-utils";

@Module({
  imports: [MongooseModule.forFeature([{ name: ModelsNamesEnum.REFRESH_SESSION, schema: RefreshSession }], ConnectionNamesEnum.USERS)],
  providers: [TokenService],
  exports: [TokenService]
})
export class TokenModule {}
