import { IsNotEmpty, IsPhoneNumber, IsUUID } from "class-validator";

export class ChangePhoneNumberDto {
  @IsNotEmpty()
  @IsPhoneNumber()
  readonly oldPhoneNumber: string;

  @IsNotEmpty()
  @IsPhoneNumber()
  readonly newPhoneNumber: string;

  @IsNotEmpty()
  @IsUUID()
  verification: string;
}
