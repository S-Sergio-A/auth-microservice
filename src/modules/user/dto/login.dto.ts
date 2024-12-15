import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LoginByEmailDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class LoginByUsernameDto {
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class LoginByPhoneNumberDto {
  @IsNotEmpty()
  @IsEmail()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
