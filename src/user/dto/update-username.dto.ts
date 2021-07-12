import { IsDefined, IsNotEmpty, IsString, IsUUID, Length } from "class-validator";

export class ChangeUsernameDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(4, 30)
  readonly oldUsername: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(4, 30)
  readonly newUsername: string;
  
  @IsNotEmpty()
  @IsUUID()
  verification: string;
}
