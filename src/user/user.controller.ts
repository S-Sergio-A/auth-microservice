import { MessagePattern, Payload, Transport } from "@nestjs/microservices";
import { Controller, UseFilters } from "@nestjs/common";
import { ExceptionFilter } from "../exceptions/filters/Exception.filter";
import { LoginByEmailDto, LoginByPhoneNumberDto, LoginByUsernameDto } from "./dto/login.dto";
import { IpAgentFingerprint, RequestInfo } from "./interfaces/request-info.interface";
import { AddOrUpdateOptionalDataDto } from "./dto/add-or-update-optional-data.dto";
import { VerifyPasswordResetDto } from "./dto/verify-password-reset.dto";
import { ChangePhoneNumberDto } from "./dto/update-phone.dto";
import { ChangePasswordDto } from "./dto/update-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ChangeEmailDto } from "./dto/update-email.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import { UserService } from "./user.service";
import { ChangeUsernameDto } from "./dto/update-username.dto";

@UseFilters(ExceptionFilter)
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
  async resetPassword(
    @Payload()
    data: IpAgentFingerprint & {
      forgotPasswordDto: ForgotPasswordDto;
    }
  ) {
    return await this.userService.restPassword(data);
  }

  @MessagePattern({ cmd: "verify-password-reset" }, Transport.REDIS)
  async verifyPasswordReset(@Payload() data: { userId: string; verifyUuidDto: VerifyPasswordResetDto }) {
    return await this.userService.verifyPasswordReset(data);
  }

  @MessagePattern({ cmd: "change-email" }, Transport.REDIS)
  async changeEmail(@Payload() data: IpAgentFingerprint & { userId: string; changeEmailDto: ChangeEmailDto }) {
    return await this.userService.changeEmail(data);
  }
  
  @MessagePattern({ cmd: "change-username" }, Transport.REDIS)
  async changeUsername(@Payload() data: IpAgentFingerprint & { userId: string; changeUsernameDto: ChangeUsernameDto }) {
    return await this.userService.changeUsername(data);
  }

  @MessagePattern({ cmd: "change-password" }, Transport.REDIS)
  async changePassword(@Payload() data: IpAgentFingerprint & { userId: string; changePasswordDto: ChangePasswordDto }) {
    return await this.userService.changePassword(data);
  }

  @MessagePattern({ cmd: "change-phone" }, Transport.REDIS)
  async changePhoneNumber(@Payload() data: IpAgentFingerprint & { userId: string; changePhoneNumberDto: ChangePhoneNumberDto }) {
    return await this.userService.changePhoneNumber(data);
  }
  
  @MessagePattern({ cmd: "verify-primary-data-change" }, Transport.REDIS)
  async verifyPrimaryDataChange(@Payload() data: { userId: string; verification: string; dataType: "email" | "password" | "username" | "phone" }) {
    return await this.userService.verifyPrimaryDataChange(data);
  }

  @MessagePattern({ cmd: "change-optional" }, Transport.REDIS)
  async addOrChangeOptionalData(@Payload() data: { userId: string; optionalDataDto: AddOrUpdateOptionalDataDto }) {
    return await this.userService.addOrChangeOptionalData(data);
  }

  @MessagePattern({ cmd: "refresh-session" }, Transport.REDIS)
  async refreshSession(@Payload() data: RequestInfo) {
    return await this.userService.refreshSession(data);
  }
}
