import { IsDefined, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserChangePasswordDto {
  @ApiProperty({
    example: 'Old secret password.',
    description: 'The password of the User.',
    format: 'string',
    minLength: 8,
    maxLength: 50,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  oldPassword: string;

  @ApiProperty({
    example: 'New secret password.',
    description: 'The password of the User.',
    format: 'string',
    minLength: 8,
    maxLength: 50,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  newPassword: string;
}
