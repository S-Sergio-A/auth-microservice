import { IsNotEmpty, IsString, IsUUID, Length } from "class-validator";

export class ChangeUsernameDto {
  @IsNotEmpty()
  @IsString()
  @Length(4, 30)
  readonly oldUsername: string;

  @IsNotEmpty()
  @IsString()
  @Length(4, 30)
  readonly newUsername: string;

  @IsNotEmpty()
  @IsUUID()
  verification: string;
}
