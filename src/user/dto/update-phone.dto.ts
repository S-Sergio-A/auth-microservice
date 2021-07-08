import { IsDefined, IsNotEmpty, IsOptional, IsPhoneNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UserChangePhoneNumberDto {
  @ApiProperty({
    example: "+380501224456, or +380 (050) 122-44-56.",
    description: "The old mobile phone number of the User.",
    format: "string",
    minLength: 12,
    maxLength: 20
  })
  @IsDefined()
  @IsNotEmpty()
  @IsPhoneNumber()
  @IsOptional()
  oldPhoneNumber: string;

  @ApiProperty({
    example: "+380501224456, or +380 (050) 122-44-56.",
    description: "The new mobile phone number of the User.",
    format: "string",
    minLength: 12,
    maxLength: 20
  })
  @IsDefined()
  @IsNotEmpty()
  @IsPhoneNumber()
  @IsOptional()
  newPhoneNumber: string;
}
