import { IsDefined, IsNotEmpty, IsOptional, IsPhoneNumber } from "class-validator";

export class UserChangePhoneNumberDto {
  @IsDefined()
  @IsNotEmpty()
  @IsPhoneNumber()
  @IsOptional()
  oldPhoneNumber: string;

  @IsDefined()
  @IsNotEmpty()
  @IsPhoneNumber()
  @IsOptional()
  newPhoneNumber: string;
}
