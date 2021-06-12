import {IsDefined, IsNotEmpty, IsString, Length} from "class-validator";

export class UserChangePasswordDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  oldPassword: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  newPassword: string;
}
