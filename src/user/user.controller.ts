import { Controller, Post, Body, Put, UseFilters, HttpCode, HttpStatus, Req, Get, Res } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags, ApiOperation } from "@nestjs/swagger";
import { Request, Response } from "express";
import { ChangePhoneNumberValidationPipe } from "../pipes/validation/changePhoneNumber.validation.pipe";
import { ChangePasswordValidationPipe } from "../pipes/validation/changePassword.validation.pipe";
import { RequestBodyExceptionFilter } from "../exceptions/filters/RequestBody.exception-filter";
import { OptionalDataValidationPipe } from "../pipes/validation/optionalData.validation.pipe";
import { RegistrationValidationPipe } from "../pipes/validation/registration.validation.pipe";
import { ValidationExceptionFilter } from "../exceptions/filters/Validation.exception-filter";
import { ChangeEmailValidationPipe } from "../pipes/validation/changeEmail.validation.pipe";
import { InternalExceptionFilter } from "../exceptions/filters/Internal.exception-filter";
import { LoginValidationPipe } from "../pipes/validation/login.validation.pipe";
import { LoginByEmailDto, LoginByPhoneNumberDto, LoginByUsernameDto } from "./dto/login.dto";
import { AddOrUpdateOptionalDataDto } from "./dto/add-or-update-optional-data.dto";
import { UserChangePhoneNumberDto } from "./dto/update-phone.dto";
import { UserChangePasswordDto } from "./dto/update-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { UserChangeEmailDto } from "./dto/update-email.dto";
import { VerifyUuidDto } from "./dto/verify-uuid.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import { UserService } from "./user.service";

@UseFilters(ValidationExceptionFilter)
@UseFilters(RequestBodyExceptionFilter)
@UseFilters(InternalExceptionFilter)
@Controller("user")
@ApiTags("User")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("/sign-up")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register user." })
  @ApiCreatedResponse({})
  async register(@Body(new RegistrationValidationPipe()) createUserDto: SignUpDto) {
    return await this.userService.register(createUserDto);
  }

  @Post("/login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Log in the user." })
  @ApiCreatedResponse({})
  async login(
    @Req() req: Request,
    @Res() res: Response,
    @Body(new LoginValidationPipe()) loginUserDto: LoginByEmailDto & LoginByUsernameDto & LoginByPhoneNumberDto
  ) {
    return await this.userService.login(req, res, loginUserDto);
  }

  @Post("/forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request resetting for a forgotten password." })
  @ApiOkResponse({})
  async forgotPassword(@Req() req: Request, @Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.userService.forgotPassword(req, forgotPasswordDto);
  }

  @Put("/forgot-password-verify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify a password reset operation and create a new password." })
  @ApiOkResponse({})
  async forgotPasswordVerify(@Req() req: Request, @Body() verifyUuidDto: VerifyUuidDto) {
    return await this.userService.forgotPasswordVerify(req, verifyUuidDto);
  }

  @Put("/email/:id")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Change an email." })
  @ApiCreatedResponse({})
  async changeEmail(@Req() req: Request, @Body(new ChangeEmailValidationPipe()) changeEmailDto: UserChangeEmailDto) {
    return await this.userService.changeEmail(req, changeEmailDto);
  }

  @Put("/password/:id")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Change a password." })
  @ApiCreatedResponse({})
  async changePassword(@Req() req: Request, @Body(new ChangePasswordValidationPipe()) changePasswordDto: UserChangePasswordDto) {
    return await this.userService.changePassword(req, changePasswordDto);
  }

  @Put("/phone/:id")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Change a password." })
  @ApiCreatedResponse({})
  async changePhoneNumber(
    @Req() req: Request,
    @Body(new ChangePhoneNumberValidationPipe()) changePhoneNumberDto: UserChangePhoneNumberDto
  ) {
    return await this.userService.changePhoneNumber(req, changePhoneNumberDto);
  }

  @Put("/optional/:id")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add or update an optional data (first and last name, birthday, mobile phone number)." })
  @ApiCreatedResponse({})
  async addOrChangeOptionalData(@Req() req: Request, @Body(new OptionalDataValidationPipe()) optionalDataDto: AddOrUpdateOptionalDataDto) {
    return await this.userService.addOrChangeOptionalData(req, optionalDataDto);
  }

  @Get("/refresh-session")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh the user session." })
  @ApiCreatedResponse({})
  async refreshAccessToken(@Req() req: Request, @Res() res: Response) {
    return await this.userService.refreshSession(req, res);
  }
}
