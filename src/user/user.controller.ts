import { MessagePattern, Payload, Transport } from "@nestjs/microservices";
import { Controller, UseFilters } from "@nestjs/common";
import { RequestBodyExceptionFilter } from "../exceptions/filters/RequestBody.exception-filter";
import { ValidationExceptionFilter } from "../exceptions/filters/Validation.exception-filter";
import { InternalExceptionFilter } from "../exceptions/filters/Internal.exception-filter";
import { LoginByEmailDto, LoginByPhoneNumberDto, LoginByUsernameDto } from "./dto/login.dto";
import { AddOrUpdateOptionalDataDto } from "./dto/add-or-update-optional-data.dto";
import { UserChangePhoneNumberDto } from "./dto/update-phone.dto";
import { UserChangePasswordDto } from "./dto/update-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { UserChangeEmailDto } from "./dto/update-email.dto";
import { VerifyUuidDto } from "./dto/verify-uuid.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import { UserService } from "./user.service";
import { IpAgentFingerprint, RequestInfo } from "./interfaces/request-info.interface";

@UseFilters(ValidationExceptionFilter)
@UseFilters(RequestBodyExceptionFilter)
@UseFilters(InternalExceptionFilter)
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern({ cmd: "register" }, Transport.REDIS)
  async register(@Payload() createUserDto: SignUpDto) {
    return await this.userService.register(createUserDto);
  }

  @MessagePattern({ cmd: "login" }, Transport.REDIS)
  async login(
    @Payload()
    data: IpAgentFingerprint & {
      loginUserDto: LoginByEmailDto & LoginByUsernameDto & LoginByPhoneNumberDto;
    }
  ) {
    return await this.userService.login(data);
  }

  @MessagePattern({ cmd: "logout" }, Transport.REDIS)
  async logout(
    @Payload()
    data: RequestInfo
  ) {
    return await this.userService.logout(data);
  }

  @MessagePattern({ cmd: "forgot-password" }, Transport.REDIS)
  async forgotPassword(
    @Payload()
    data: IpAgentFingerprint & {
      forgotPasswordDto: ForgotPasswordDto;
    }
  ) {
    return await this.userService.forgotPassword(data);
  }

  @MessagePattern({ cmd: "forgot-password-verify" }, Transport.REDIS)
  async forgotPasswordVerify(@Payload() data: { userId: string; verifyUuidDto: VerifyUuidDto }) {
    return await this.userService.forgotPasswordVerify(data);
  }

  @MessagePattern({ cmd: "change-email" }, Transport.REDIS)
  async changeEmail(@Payload() data: { userId: string; changeEmailDto: UserChangeEmailDto }) {
    return await this.userService.changeEmail(data);
  }

  @MessagePattern({ cmd: "change-password" }, Transport.REDIS)
  async changePassword(@Payload() data: { userId: string; changePasswordDto: UserChangePasswordDto }) {
    return await this.userService.changePassword(data);
  }

  @MessagePattern({ cmd: "change-phone" }, Transport.REDIS)
  async changePhoneNumber(@Payload() data: { userId: string; changePhoneNumberDto: UserChangePhoneNumberDto }) {
    return await this.userService.changePhoneNumber(data);
  }

  @MessagePattern({ cmd: "change-optional" }, Transport.REDIS)
  async addOrChangeOptionalData(@Payload() data: { userId: string; addOrUpdateOptionalDataDto: AddOrUpdateOptionalDataDto }) {
    return await this.userService.addOrChangeOptionalData(data);
  }

  @MessagePattern({ cmd: "refresh-session" }, Transport.REDIS)
  async refreshAccessToken(@Payload() data: RequestInfo) {
    return await this.userService.refreshSession(data);
  }
}
