import { IsDefined, IsNotEmpty, IsString, IsUUID, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class VerifyUuidDto {
  @ApiProperty({
    description: 'Verification code assigned to entrance when "forgot password" request received.',
    format: "uuid",
    uniqueItems: true
  })
  @IsNotEmpty()
  @IsUUID()
  readonly verification: string;

  @ApiProperty({
    example: "New secret password.",
    description: "The new password of the User.",
    format: "string",
    minLength: 8,
    maxLength: 50
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  newPassword: string;

  @ApiProperty({
    example: "New secret password.",
    description: "The password verification of the User.",
    format: "string",
    minLength: 8,
    maxLength: 50
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  newPasswordVerification: string;
}
