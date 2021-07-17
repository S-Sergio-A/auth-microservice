import { IsDefined, IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class ContactFormDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(36, 36)
  id: string;

  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  @Length(6, 254)
  readonly clientEmail: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  readonly clientFullName: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 200)
  readonly subject: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(1, 2000)
  readonly message: string;
}
