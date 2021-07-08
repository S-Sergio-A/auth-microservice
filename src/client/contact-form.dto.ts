import { IsDefined, IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ContactFormDto {
  @ApiProperty({
    example: "3dbdf9a931689e5f727c55694718afa8",
    description: "The ID of the Client.",
    format: "string",
    minLength: 36,
    maxLength: 36
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(36, 36)
  id: string;

  @ApiProperty({
    example: "petroshrekovenko@gmail.com",
    description: "The email of the Client.",
    format: "email",
    uniqueItems: true,
    minLength: 6,
    maxLength: 254
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  @Length(6, 254)
  readonly clientEmail: string;

  @ApiProperty({
    example: "Petro Shrekovenko.",
    description: "The full name of the Client.",
    format: "string",
    minLength: 2,
    maxLength: 100
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  readonly clientFullName: string;

  @ApiProperty({
    example: "Careers | PR | Support.",
    description: "The subject of the appeal.",
    format: "string",
    minLength: 8,
    maxLength: 200
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 200)
  readonly subject: string;

  @ApiProperty({
    description: "The message of the Client.",
    format: "string",
    minLength: 8,
    maxLength: 200
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(1, 2000)
  readonly message: string;
}
