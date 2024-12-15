import { IsEmail, IsString, Length } from "class-validator";

export class ForgotPasswordDto {
  @IsString()
  @IsEmail()
  @Length(6, 254)
  readonly email: string;
}
