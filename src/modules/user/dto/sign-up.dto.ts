import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, IsUrl, Length } from "class-validator";

export class SignUpDto {
  @IsNotEmpty()
  @IsString()
  @Length(32, 32)
  id: string;

  @IsNotEmpty()
  @IsEmail()
  @Length(6, 254)
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  @Length(4, 30)
  readonly username: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 200)
  password: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 200)
  passwordVerification: string;

  @IsNotEmpty()
  @IsPhoneNumber()
  @IsOptional()
  phoneNumber: string;

  @IsNotEmpty()
  @IsUrl()
  @IsOptional()
  photo: string;
}
