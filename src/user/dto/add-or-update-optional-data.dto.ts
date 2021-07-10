import { IsDate, IsDefined, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AddOrUpdateOptionalDataDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  firstName: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  lastName: string;

  @IsDefined()
  @IsNotEmpty()
  @IsDate()
  @IsOptional()
  birthday: string;
}
