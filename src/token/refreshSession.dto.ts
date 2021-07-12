import { IsDefined, IsNotEmpty, IsNumber, IsString, IsUUID, Length } from "class-validator";

export class RefreshSessionDto {
  @IsDefined()
  @IsNotEmpty()
  @IsUUID()
  @Length(36, 36)
  readonly userId: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  refreshToken?: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  readonly ip: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  readonly userAgent: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(20, 20)
  readonly fingerprint: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @Length(13, 13)
  readonly expiresIn: number;
  
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @Length(13, 13)
  readonly createdAt: number;
}
