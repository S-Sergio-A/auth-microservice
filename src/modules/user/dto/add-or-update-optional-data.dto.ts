import { IsDate, IsOptional, IsString } from "class-validator";

export class AddOrUpdateOptionalDataDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsDate()
  @IsOptional()
  birthday?: string;
}
