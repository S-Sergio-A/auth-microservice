import { IsDefined, IsEmail, IsNotEmpty, IsString, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginByEmailDto {
  @ApiProperty({
    example: "petroshrekovenko@gmail.com",
    description: "The email of the User.",
    format: "email",
    uniqueItems: true,
    minLength: 6,
    maxLength: 254
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "Secret password.",
    description: "The password of the User.",
    format: "string",
    uniqueItems: true,
    minLength: 8,
    maxLength: 50
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class LoginByUsernameDto {
  @ApiProperty({
    example: "PetroShrekovenko.",
    description: "The username of the User.",
    format: "string",
    uniqueItems: true,
    minLength: 4,
    maxLength: 30
  })
  @IsDefined()
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  username: string;

  @ApiProperty({
    example: "Secret password.",
    description: "The password of the User.",
    format: "string",
    uniqueItems: true,
    minLength: 8,
    maxLength: 50
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class LoginByPhoneNumberDto {
  @ApiProperty({
    example: "+380509876543",
    description: "The phone number of the User.",
    format: "string",
    uniqueItems: true,
    minLength: 10,
    maxLength: 20
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  phoneNumber: string;

  @ApiProperty({
    example: "Secret password.",
    description: "The password of the User.",
    format: "string",
    uniqueItems: true,
    minLength: 8,
    maxLength: 50
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  password: string;
}
