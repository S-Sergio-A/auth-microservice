import { IsDefined, IsNotEmpty, IsNumber, IsString, IsUUID, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RefreshSessionDto {
  @ApiProperty({
    example: "3dbdf9a931689e5f727c55694718afa8",
    description: "The ID of the User.",
    format: "string",
    uniqueItems: true,
    minLength: 36,
    maxLength: 36
  })
  @IsDefined()
  @IsNotEmpty()
  @IsUUID()
  @Length(36, 36)
  readonly userId: string;

  @ApiProperty({
    description: "The refresh-token of the User.",
    format: "string",
    uniqueItems: true
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  refreshToken?: string;

  @ApiProperty({
    example: "::ffff:10.10.227.188",
    description: "The ip-address of the User.",
    format: "string",
    uniqueItems: true
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  readonly ip: string;

  @ApiProperty({
    example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36",
    description: "The user-agent of the User.",
    format: "email",
    uniqueItems: true
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  readonly userAgent: string;

  @ApiProperty({
    example: "kHqPGWS1Mj18sZFsP8Wl",
    description: "The browser fingerprint of the User.",
    format: "string",
    uniqueItems: true,
    minLength: 20,
    maxLength: 20
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(20, 20)
  readonly fingerprint: string;

  @ApiProperty({
    example: "1623602001496",
    description: "The email of the User.",
    format: "number",
    uniqueItems: true,
    minLength: 13,
    maxLength: 13
  })
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @Length(13, 13)
  readonly expiresIn: number;

  @ApiProperty({
    example: "1623604001496",
    description: "The email of the User.",
    format: "email",
    uniqueItems: true,
    minLength: 13,
    maxLength: 13
  })
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @Length(13, 13)
  readonly createdAt: number;
}
