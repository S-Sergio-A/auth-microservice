import {IsDate, IsDefined, IsNotEmpty, IsOptional, IsPhoneNumber, IsString} from "class-validator";

export class UserAddOrUpdateOptionalDataDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  firstName: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  lastName: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsDate()
  @IsOptional()
  birthday: string;
  
  @IsDefined()
  @IsNotEmpty()
  @IsPhoneNumber('UA' || 'RU' || 'US')
  @IsOptional()
  phoneNumber: string;
}
