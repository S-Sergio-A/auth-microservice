import { Injectable } from "@nestjs/common";
import { RabbitQueuesEnum } from "@ssmovzh/chatterly-common-utils";
import { UserService } from "~/modules/user/user.service";

@Injectable()
export class UserHandlers {
  private handlers = new Map<RabbitQueuesEnum, any>();

  constructor(private readonly userService: UserService) {
    this.handlers.set(RabbitQueuesEnum.SIGN_UP, this.userService.register.bind(this.userService));
    this.handlers.set(RabbitQueuesEnum.VERIFY_SIGN_UP, this.userService.verifyRegistration.bind(this.userService));
    this.handlers.set(RabbitQueuesEnum.LOGIN, this.userService.login.bind(this.userService));
    this.handlers.set(RabbitQueuesEnum.LOG_OUT, this.userService.logout.bind(this.userService));
    this.handlers.set(RabbitQueuesEnum.FORGOT_PASSWORD, this.userService.resetPassword.bind(this.userService));
    this.handlers.set(RabbitQueuesEnum.VERIFY_PASSWORD_RESET, this.userService.verifyPasswordReset.bind(this.userService));
    this.handlers.set(RabbitQueuesEnum.CHANGE_EMAIL, this.userService.changeEmail.bind(this.userService));
    this.handlers.set(RabbitQueuesEnum.CHANGE_USERNAME, this.userService.changeUsername.bind(this.userService));
    this.handlers.set(RabbitQueuesEnum.CHANGE_PASSWORD, this.userService.changePassword.bind(this.userService));
    this.handlers.set(RabbitQueuesEnum.CHANGE_PHOTO, this.userService.changePhoneNumber.bind(this.userService));
    this.handlers.set(RabbitQueuesEnum.VERIFY_ACCOUNT_UPDATE, this.userService.verifyPrimaryDataChange.bind(this.userService));
    this.handlers.set(RabbitQueuesEnum.CHANGE_DETAILS, this.userService.addOrChangeOptionalData.bind(this.userService));
    this.handlers.set(RabbitQueuesEnum.CHANGE_PHOTO, this.userService.changePhoto.bind(this.userService));
    this.handlers.set(RabbitQueuesEnum.REFRESH_SESSION, this.userService.refreshSession.bind(this.userService));
  }

  get(action: RabbitQueuesEnum): () => any {
    const handlerFunction = this.handlers.get(action);

    if (!handlerFunction) {
      throw new Error("Unknown queue type.");
    }

    return handlerFunction;
  }
}
