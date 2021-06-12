import {IsDefined, IsEmail, IsNotEmpty, IsString, Length} from "class-validator";

export class UserChangeEmailDto {
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  oldEmail: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  @Length(6, 254)
  newEmail: string;
}
