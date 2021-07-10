import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { v4 } from "uuid";
// potential module dependency error
import { IpAgentFingerprint } from "../user/interfaces/request-info.interface";
import { GlobalErrorCodes } from "../exceptions/errorCodes/GlobalErrorCodes";
import { InternalException } from "../exceptions/Internal.exception";
import { AuthService } from "../auth/services/auth.service";
import { ClientSessionDocument } from "./schemas/client-session.schema";
import { ContactFormDocument } from "./schemas/contact-form.schema";
import { ContactFormDto } from "./contact-form.dto";

@Injectable()
export class ClientService {
  constructor(
    @InjectModel("Contact-Form")
    private readonly contactFormModel: Model<ContactFormDocument>,
    @InjectModel("Client-Session")
    private readonly clientSessionModel: Model<ClientSessionDocument>,
    private readonly authService: AuthService
  ) {}

  async contact(contactFormDto: ContactFormDto): Promise<HttpStatus> {
    try {
      const appeal = new this.contactFormModel(contactFormDto);
      appeal.id = v4();
      await appeal.save();
      return HttpStatus.OK;
    } catch (e) {
      console.log(e.stack);
      if (e instanceof InternalException) {
        throw new InternalException({
          key: "INTERNAL_ERROR",
          code: GlobalErrorCodes.INTERNAL_ERROR.code,
          message: GlobalErrorCodes.INTERNAL_ERROR.value
        });
      }
    }
  }

  async generateToken({ ip, userAgent, fingerprint }: IpAgentFingerprint): Promise<HttpStatus> {
    try {
      const sessionData = {
        clientId: v4(),
        ip,
        userAgent,
        fingerprint
      };

      this.authService.generateClientsJWT(sessionData).then((clientToken) => {
        new this.clientSessionModel(sessionData).save();
        return { clientToken };
      });
      
      return HttpStatus.BAD_REQUEST;
    } catch (e) {
      console.log(e.stack);
      if (e instanceof InternalException) {
        throw new InternalException({
          key: "INTERNAL_ERROR",
          code: GlobalErrorCodes.INTERNAL_ERROR.code,
          message: GlobalErrorCodes.INTERNAL_ERROR.value
        });
      }
    }
  }
}
