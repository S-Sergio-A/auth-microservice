import { Controller, Post, Body, Put, Param, UseFilters } from '@nestjs/common';
import { UserAddOrUpdateOptionalDataDto } from '../dto/add-or-update-optional-data.dto';
import { UserChangePasswordDto } from '../dto/update-password.dto';
import { UserChangeEmailDto } from '../dto/update-email.dto';
import { UserSignUpDto } from '../dto/sign-up.dto';
import { HttpExceptionFilter } from '../exception/exceptionFilter';
import { UserService } from '../services/user.service';
import { TokenService } from '../services/token.service';

@UseFilters(new HttpExceptionFilter())
@Controller('user')
export class AuthenticationController {
  constructor(
    private userService: UserService,
    private tokenService: TokenService,
  ) {}

  @Post('/sign-up')
  register(@Body() user: UserSignUpDto) {}

  @Post('/login')
  login(@Body() user: UserSignUpDto) {}

  @Put('/email/:id')
  changeEmail(
    @Param('id') id: string,
    @Body() updatedEmail: UserChangeEmailDto,
  ) {}

  @Put('/password/:id')
  changePassword(
    @Param('id') id: string,
    @Body() updatedPassword: UserChangePasswordDto,
  ) {}

  @Post('/optional/:id')
  addOrChangeOptionalData(
    @Param('id') id: string,
    @Body() optionalData: UserAddOrUpdateOptionalDataDto,
  ) {}
  
  // @Post('/optional/:id')
  // addOrChangeOptionalData(
  //   @Param('id') id: string,
  //   @Body() optionalData: UserAddOrUpdateOptionalDataDto,
  // ) {}
  //
  // @Post('/optional/:id')
  // addOrChangeOptionalData(
  //   @Param('id') id: string,
  //   @Body() optionalData: UserAddOrUpdateOptionalDataDto,
  // ) {}
  
  
}
