import { IsDate, IsDefined, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AddOrUpdateOptionalDataDto {
  @ApiProperty({
    example: "Petro",
    description: "The first name of the User.",
    format: "string",
    minLength: 1,
    maxLength: 50
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  firstName: string;

  @ApiProperty({
    example: "Shrekovenko",
    description: "The last name of the User.",
    format: "string",
    minLength: 1,
    maxLength: 50
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  lastName: string;

  @ApiProperty({
    example: "02.10.2002",
    description: "The birthday of the User.",
    format: "date",
    minLength: 10,
    maxLength: 10
  })
  @IsDefined()
  @IsNotEmpty()
  @IsDate()
  @IsOptional()
  birthday: string;
}
