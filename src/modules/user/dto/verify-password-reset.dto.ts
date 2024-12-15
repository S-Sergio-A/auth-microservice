import { IsNotEmpty, IsString, IsUUID, Length } from "class-validator";

export class VerifyPasswordResetDto {
  @IsNotEmpty()
  @IsUUID()
  readonly verification: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  newPasswordVerification: string;
}
