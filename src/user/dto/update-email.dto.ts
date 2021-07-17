import { IsDefined, IsEmail, IsNotEmpty, IsUUID, Length } from "class-validator";

export class ChangeEmailDto {
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  oldEmail: string;

  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  @Length(6, 254)
  newEmail: string;

  @IsNotEmpty()
  @IsUUID()
  verification: string;
}
