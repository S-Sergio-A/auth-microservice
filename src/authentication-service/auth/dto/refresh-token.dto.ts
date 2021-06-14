import { IsDefined, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token UUID',
    format: 'uuid',
    uniqueItems: true,
  })
  @IsNotEmpty()
  @IsUUID()
  readonly refreshToken: string;

  // @ApiProperty({
  //     example: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NzgyN2Q4MGIxMGU3MTFjYzY4YyIsImlhdCI6MTYyMTU5MTQyOSwiZXhwIjoxNjI2Nzc1NDI5LCJzdWIiOiI3NzgyN2Q4MGIxMGU3MTFjYzY4YyJ9.28sHrLDI5Bb0oYgeubAKaviU1xuNeC3GjCxf-TRF8Nd7Xo9hdv0WqjOLW4ZZ02LkMoK4jbDpfO4Wq6GC77_Nxg',
  //     description: 'The refresh-token of the User.',
  //     format: 'string',
  //     uniqueItems: true
  // })
  // @IsDefined()
  // @IsNotEmpty()
  // @IsString()
  // readonly refreshToken: string;
}
