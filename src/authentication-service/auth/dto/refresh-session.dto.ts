import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshSessionDto {
  @ApiProperty({
    example: '3dbdf9a931689e5f727c55694718afa8',
    description: 'The ID of the User.',
    format: 'string',
    uniqueItems: true,
    minLength: 32,
    maxLength: 32,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsUUID()
  @Length(32, 32)
  readonly userId: string;

  // @ApiProperty({
  //   example:
  //     'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NzgyN2Q4MGIxMGU3MTFjYzY4YyIsImlhdCI6MTYyMTU5MTQyOSwiZXhwIjoxNjI2Nzc1NDI5LCJzdWIiOiI3NzgyN2Q4MGIxMGU3MTFjYzY4YyJ9.28sHrLDI5Bb0oYgeubAKaviU1xuNeC3GjCxf-TRF8Nd7Xo9hdv0WqjOLW4ZZ02LkMoK4jbDpfO4Wq6GC77_Nxg',
  //   description: 'The refresh-token of the User.',
  //   format: 'string',
  //   uniqueItems: true,
  // })
  // @IsDefined()
  // @IsNotEmpty()
  // @IsString()
  // readonly refreshToken: string;

  @ApiProperty({
    example: '::ffff:10.10.227.188',
    description: 'The ip-address of the User.',
    format: 'string',
    uniqueItems: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  readonly ip: string;

  @ApiProperty({
    example:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36',
    description: 'The user-agent of the User.',
    format: 'email',
    uniqueItems: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  readonly userAgent: string;

  @ApiProperty({
    example: 'kHqPGWS1Mj18sZFsP8Wl',
    description: 'The browser fingerprint of the User.',
    format: 'string',
    uniqueItems: true,
    minLength: 20,
    maxLength: 20,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(20, 20)
  readonly fingerprint: string;

  @ApiProperty({
    example: '1623602001496',
    description: 'The email of the User.',
    format: 'number',
    uniqueItems: true,
    minLength: 13,
    maxLength: 13,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @Length(13, 13)
  readonly expiresIn: number;

  @ApiProperty({
    example: '1623604001496',
    description: 'The email of the User.',
    format: 'email',
    uniqueItems: true,
    minLength: 13,
    maxLength: 13,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @Length(13, 13)
  readonly createdAt: number;
}
