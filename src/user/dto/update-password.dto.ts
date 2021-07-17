import { IsDefined, IsNotEmpty, IsString, IsUUID, Length } from "class-validator";

export class ChangePasswordDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  oldPassword: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  newPassword: string;

  @IsNotEmpty()
  @IsUUID()
  verification: string;
}
