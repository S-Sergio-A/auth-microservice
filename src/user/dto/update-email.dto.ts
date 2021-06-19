import { IsDefined, IsEmail, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserChangeEmailDto {
  @ApiProperty({
    example: 'oldpetroshrekovenko@gmail.com',
    description: 'The old email of the User.',
    format: 'email',
    uniqueItems: true,
    minLength: 6,
    maxLength: 254
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  oldEmail: string;

  @ApiProperty({
    example: 'newpetroshrekovenko@gmail.com',
    description: 'The new email of the User.',
    format: 'email',
    uniqueItems: true,
    minLength: 6,
    maxLength: 254
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  @Length(6, 254)
  newEmail: string;
}
