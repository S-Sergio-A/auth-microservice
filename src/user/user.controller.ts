import { Controller, Post, Body, Put, UseFilters, HttpCode, HttpStatus, Req, Get } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { RequestBodyAndInternalExceptionFilter } from '../exceptions/filters/RequestBodyAndInternal.exception-filter';
import { ChangePasswordValidationPipe } from '../pipes/validation/changePassword.validation.pipe';
import { OptionalDataValidationPipe } from '../pipes/validation/optionalData.validation.pipe';
import { RegistrationValidationPipe } from '../pipes/validation/registration.validation.pipe';
import { ValidationExceptionFilter } from '../exceptions/filters/Validation.exception-filter';
import { ChangeEmailValidationPipe } from '../pipes/validation/changeEmail.validation.pipe';
import { LoginValidationPipe } from '../pipes/validation/login.validation.pipe';
import { AddOrUpdateOptionalDataDto } from './dto/add-or-update-optional-data.dto';
import { LoginByEmailDto, LoginByUsernameDto } from './dto/login.dto';
import { UserChangePasswordDto } from './dto/update-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { UserChangeEmailDto } from './dto/update-email.dto';
import { UserService } from './user.service';
import { VerifyUuidDto } from './dto/verify-uuid.dto';
import { SignUpDto } from './dto/sign-up.dto';

@UseFilters(new RequestBodyAndInternalExceptionFilter(), new ValidationExceptionFilter())
@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(
    private readonly userService: UserService
  ) {}
  

  @Post('/sign-up')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register user.' })
  @ApiCreatedResponse({})
  async register(@Req() req: Request, @Body(new RegistrationValidationPipe()) createUserDto: SignUpDto) {
    return await this.userService.register(req, createUserDto);
  }

  // @Post('verify-email')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Verify email.' })
  // @ApiOkResponse({})
  // async verifyEmail(@Req() req: Request, @Body() verifyUuidDto: VerifyUuidDto) {
  //   return await this.userService.verifyEmail(req, verifyUuidDto);
  // }

  @Post('/login')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Log in user.' })
  @ApiCreatedResponse({})
  async login(@Req() req: Request, @Body(new LoginValidationPipe()) loginUserDto: LoginByEmailDto & LoginByUsernameDto) {
    return await this.userService.login(req, loginUserDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request resetting forgotten password.' })
  @ApiOkResponse({})
  async forgotPassword(@Req() req: Request, @Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.userService.forgotPassword(req, forgotPasswordDto);
  }

  @Post('forgot-password-verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify password reset operation and create new password.' })
  @ApiOkResponse({})
  async forgotPasswordVerify(@Req() req: Request, @Body() verifyUuidDto: VerifyUuidDto) {
    return await this.userService.forgotPasswordVerify(req, verifyUuidDto);
  }

  @Put('/email/:id')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Change email.' })
  @ApiCreatedResponse({})
  async changeEmail(@Req() req: Request, @Body(new ChangeEmailValidationPipe()) changeEmailDto: UserChangeEmailDto) {
    return await this.userService.changeEmail(req, changeEmailDto);
  }

  @Put('/password/:id')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Change password.' })
  @ApiCreatedResponse({})
  async changePassword(@Req() req: Request, @Body(new ChangePasswordValidationPipe()) changePasswordDto: UserChangePasswordDto) {
    return await this.userService.changePassword(req, changePasswordDto);
  }

  @Put('/optional/:id')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add or update optional data (first and last name, birthday, mobile phone number).' })
  @ApiCreatedResponse({})
  async addOrChangeOptionalData(@Req() req: Request, @Body(new OptionalDataValidationPipe()) optionalDataDto: AddOrUpdateOptionalDataDto) {
    return await this.userService.addOrChangeOptionalData(req, optionalDataDto);
  }

  @Get('refresh-session')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Refresh user session.' })
  @ApiCreatedResponse({})
  async refreshAccessToken(@Req() req: Request) {
    return await this.userService.refreshSession(req);
  }
}
