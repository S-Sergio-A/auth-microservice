import { IsNotEmpty, IsEmail, IsString, Length } from "class-validator";

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @Length(6, 254)
  readonly email: string;
}
