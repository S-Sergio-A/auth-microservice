import { Controller, Post, Body, Put, Param, UseFilters } from '@nestjs/common';
import { UserControllerInterface } from './interfaces/user.controller.interface';
import { UserChangePasswordDto } from '../dto/update-password.dto';
import { HttpExceptionFilter } from '../exceptions/filters/RequestBodyAndInternal.exception-filter';
import { UserChangeEmailDto } from '../dto/update-email.dto';
import { TokenService } from '../services/token/token.service';
import { UserService } from '../services/user/user.service';
import { SignUpDto } from '../dto/sign-up.dto';
import { AddOrUpdateOptionalDataDto } from '../dto/add-or-update-optional-data.dto';

@UseFilters(new HttpExceptionFilter())
@Controller('user')
export class AuthenticationController implements UserControllerInterface {
  constructor(private userService: UserService, private tokenService: TokenService) {}

  @Post('/sign-up')
  register(@Body() user: SignUpDto) {}

  @Post('/login')
  login(@Body() user: SignUpDto) {}

  @Put('/email/:id')
  changeEmail(@Param('id') id: string, @Body() updatedEmail: UserChangeEmailDto) {}

  @Put('/password/:id')
  changePassword(@Param('id') id: string, @Body() updatedPassword: UserChangePasswordDto) {}

  @Post('/optional/:id')
  addOrChangeOptionalData(@Param('id') id: string, @Body() optionalData: AddOrUpdateOptionalDataDto) {}

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
