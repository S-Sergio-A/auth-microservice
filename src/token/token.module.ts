import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TokenService } from "./token.service";
import { RefreshSessionSchema } from "../modules/schemas/refreshSession.schema";

@Module({
  imports: [MongooseModule.forFeature([{ name: "Refresh-Session", schema: RefreshSessionSchema }])],
  providers: [TokenService],
  exports: [TokenService]
})
export class TokenModule {}
