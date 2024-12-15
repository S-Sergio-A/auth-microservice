import { IsNotEmpty, IsString, IsUUID, Length } from "class-validator";

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  oldPassword: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  newPassword: string;

  @IsNotEmpty()
  @IsUUID()
  verification: string;
}
