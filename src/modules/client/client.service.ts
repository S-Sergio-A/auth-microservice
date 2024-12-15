import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { v4 } from "uuid";
import { TokenService } from "../token/token.service";
import {
  ClientSession,
  ConnectionNamesEnum,
  ContactForm,
  GLOBAL_ERROR_CODES,
  GlobalErrorCodesEnum,
  LoggerService,
  ModelsNamesEnum
} from "@ssmovzh/chatterly-common-utils";
import { ContactFormDto } from "~/modules/client/dto";
import { IpAgentFingerprintInterface } from "~/modules/user/interfaces";

@Injectable()
export class ClientService {
  constructor(
    @InjectModel(ModelsNamesEnum.CONTACT_FORMS, ConnectionNamesEnum.USERS) private readonly contactFormModel: Model<ContactForm>,
    @InjectModel(ModelsNamesEnum.CLIENT_SESSIONS, ConnectionNamesEnum.CLIENTS) private readonly clientSessionModel: Model<ClientSession>,
    private readonly authService: TokenService,
    private readonly logger: LoggerService
  ) {}

  async contact(contactFormDto: ContactFormDto): Promise<void> {
    try {
      const appeal = new this.contactFormModel(contactFormDto);
      appeal.id = v4();
      await appeal.save();
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async generateToken({ ip, userAgent, fingerprint }: IpAgentFingerprintInterface): Promise<{
    clientToken: string;
  }> {
    const sessionData = {
      clientId: v4(),
      ip,
      userAgent,
      fingerprint
    };

    const clientToken = await this.authService.generateClientsAccessToken(v4(), ip);
    if (!clientToken) {
      //
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }

    await new this.clientSessionModel(sessionData).save();
    return { clientToken };
  }
}
