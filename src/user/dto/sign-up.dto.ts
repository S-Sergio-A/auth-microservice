import { IsDefined, IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, IsUrl, Length } from "class-validator";

export class SignUpDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(32, 32)
  id: string;

  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  @Length(6, 254)
  readonly email: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(4, 30)
  readonly username: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 200)
  password: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 200)
  passwordVerification: string;

  @IsDefined()
  @IsNotEmpty()
  @IsPhoneNumber()
  @IsOptional()
  phoneNumber: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsUrl()
  @IsOptional()
  photo: string;
}
