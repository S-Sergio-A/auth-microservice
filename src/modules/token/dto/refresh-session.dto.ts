import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Length } from "class-validator";

export class RefreshSessionDto {
  @IsNotEmpty()
  @IsUUID()
  @Length(36, 36)
  readonly userId: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsNotEmpty()
  @IsString()
  readonly ip: string;

  @IsNotEmpty()
  @IsString()
  readonly userAgent: string;

  @IsNotEmpty()
  @IsString()
  @Length(20, 20)
  readonly fingerprint: string;

  @IsNotEmpty()
  @IsNumber()
  readonly expiresIn: number;

  @IsNotEmpty()
  @IsNumber()
  readonly createdAt: number;
}
