import { IsDefined, IsNotEmpty, IsString, IsUUID, Length } from "class-validator";

export class VerifyPasswordResetDto {
  @IsNotEmpty()
  @IsUUID()
  readonly verification: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  newPassword: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  newPasswordVerification: string;
}
