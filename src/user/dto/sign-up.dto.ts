import { IsDefined, IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    example: '3dbdf9a931689e5f727c55694718afa8',
    description: 'The ID of the User.',
    format: 'string',
    minLength: 32,
    maxLength: 32
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(32, 32)
  userId: string;

  @ApiProperty({
    example: 'petroshrekovenko@gmail.com',
    description: 'The email of the User.',
    format: 'email',
    uniqueItems: true,
    minLength: 6,
    maxLength: 254
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  @Length(6, 254)
  readonly email: string;

  @ApiProperty({
    example: 'PetroShrekovenko.',
    description: 'The username of the User.',
    format: 'string',
    minLength: 4,
    maxLength: 30
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(4, 30)
  readonly username: string;

  @ApiProperty({
    example: 'Secret password.',
    description: 'The password of the User.',
    format: 'string',
    minLength: 8,
    maxLength: 50
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  password: string;

  @ApiProperty({
    example: 'Secret password.',
    description: 'The password verification of the User.',
    format: 'string',
    minLength: 8,
    maxLength: 50
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(8, 50)
  passwordVerification: string;
}
