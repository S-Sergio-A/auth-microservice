import {IsDefined, IsEmail, IsNotEmpty, IsString, Length} from "class-validator";

export class UserSignUpDto {
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  @Length(6, 254)
  email: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(4, 20)
  username: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  password: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  passwordVerification: string;
}
