import { HttpStatus, Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { InjectModel } from "@nestjs/mongoose";
import { Observable } from "rxjs";
import { Model } from "mongoose";
import { v4 } from "uuid";
import { IpAgentFingerprint } from "../user/interfaces/request-info.interface";
import { GlobalErrorCodes } from "../exceptions/errorCodes/GlobalErrorCodes";
import { TokenService } from "../token/token.service";
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
    private readonly authService: TokenService
  ) {}

  async contact(contactFormDto: ContactFormDto): Promise<HttpStatus | Observable<any> | RpcException> {
    try {
      const appeal = new this.contactFormModel(contactFormDto);
      appeal.id = v4();
      await appeal.save();
      return HttpStatus.OK;
    } catch (e) {
      console.log(e.stack);
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  async generateToken({ ip, userAgent, fingerprint }: IpAgentFingerprint): Promise<HttpStatus | Observable<any> | RpcException> {
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
      return new RpcException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }
}
