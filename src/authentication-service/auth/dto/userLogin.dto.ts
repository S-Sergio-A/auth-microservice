import {IsDefined, IsEmail, IsNotEmpty, IsString, IsOptional} from "class-validator";

export class UserLoginDto {
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  email: string;
  
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
