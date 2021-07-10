import { IsDefined, IsEmail, IsNotEmpty, IsString, IsOptional } from "class-validator";

export class LoginByEmailDto {
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class LoginByUsernameDto {
  @IsDefined()
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  username: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class LoginByPhoneNumberDto {
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  phoneNumber: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  password: string;
}
