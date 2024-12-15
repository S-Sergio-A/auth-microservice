import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class ContactFormDto {
  @IsNotEmpty()
  @IsEmail()
  @Length(6, 254)
  readonly clientEmail: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  readonly clientFullName: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 200)
  readonly subject: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 2000)
  readonly message: string;
}
