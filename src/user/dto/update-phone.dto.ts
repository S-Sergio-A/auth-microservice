import { IsDefined, IsNotEmpty, IsOptional, IsPhoneNumber, IsUUID } from "class-validator";

export class ChangePhoneNumberDto {
  @IsDefined()
  @IsNotEmpty()
  @IsPhoneNumber()
  @IsOptional()
  readonly oldPhoneNumber: string;

  @IsDefined()
  @IsNotEmpty()
  @IsPhoneNumber()
  @IsOptional()
  readonly newPhoneNumber: string;

  @IsNotEmpty()
  @IsUUID()
  verification: string;
}
