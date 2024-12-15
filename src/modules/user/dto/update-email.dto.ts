import { IsEmail, IsNotEmpty, IsUUID, Length } from "class-validator";

export class ChangeEmailDto {
  @IsNotEmpty()
  @IsEmail()
  oldEmail: string;

  @IsNotEmpty()
  @IsEmail()
  @Length(6, 254)
  newEmail: string;

  @IsNotEmpty()
  @IsUUID()
  verification: string;
}
