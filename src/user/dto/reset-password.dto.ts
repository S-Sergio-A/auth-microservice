import { IsNotEmpty, MinLength, MaxLength, IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'petroshrekovenko@gmail.com',
    description: 'The email of the User.',
    format: 'email',
    uniqueItems: true,
    minLength: 6,
    maxLength: 254
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(254)
  @IsEmail()
  readonly email: string;

  @ApiProperty({
    example: 'Secret password.',
    description: 'The password of the User.',
    format: 'string',
    minLength: 8,
    maxLength: 50
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  readonly password: string;
}
