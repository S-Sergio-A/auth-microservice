import { IsDate, IsDefined, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddOrUpdateOptionalDataDto {
  @ApiProperty({
    example: 'Petro',
    description: 'The first name of the User.',
    format: 'string',
    minLength: 1,
    maxLength: 50
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  firstName: string;

  @ApiProperty({
    example: 'Shrekovenko',
    description: 'The last name of the User.',
    format: 'string',
    minLength: 1,
    maxLength: 50
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  lastName: string;

  @ApiProperty({
    example: '02.10.2002',
    description: 'The birthday of the User.',
    format: 'date',
    minLength: 10,
    maxLength: 10
  })
  @IsDefined()
  @IsNotEmpty()
  @IsDate()
  @IsOptional()
  birthday: string;

  @ApiProperty({
    example: '+380501224456, or +380 (050) 122-44-56.',
    description: 'The mobile phone number of the User.',
    format: 'string',
    minLength: 12,
    maxLength: 20
  })
  @IsDefined()
  @IsNotEmpty()
  @IsPhoneNumber('UA' || 'RU' || 'US')
  @IsOptional()
  phoneNumber: string;
}
