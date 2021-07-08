import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Request, Response } from "express";
import { Model } from "mongoose";
import { v4 } from "uuid";
import { GlobalErrorCodes } from "../exceptions/errorCodes/GlobalErrorCodes";
import { InternalException } from "../exceptions/Internal.exception";
import { AuthService } from "../auth/services/auth.service";
import { ClientSessionDocument } from "./schemas/client-session.schema";
import { ContactFormDocument } from "./schemas/contact-form.schema";
import { ContactFormDto } from "./contact-form.dto";

const ms = require("ms");

@Injectable()
export class ClientService {
  constructor(
    @InjectModel("Contact-Form")
    private readonly contactFormModel: Model<ContactFormDocument>,
    @InjectModel("Client-Session")
    private readonly clientSessionModel: Model<ClientSessionDocument>,
    private readonly authService: AuthService
  ) {}

  async contact(req: Request, contactFormDto: ContactFormDto): Promise<HttpStatus> {
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

  async generateToken(req: Request, res: Response): Promise<HttpStatus> {
    try {
      const sessionData = {
        clientId: v4(),
        ip: req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
        fingerprint: req.headers["fingerprint"].toString()
      };

      this.authService.generateClientsJWT(sessionData).then((clientToken) => {
        new this.clientSessionModel(sessionData).save();
        res
          .status(HttpStatus.OK)
          .json({
            clientToken
          })
          .end();
      });
      return HttpStatus.CREATED;
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

  async _findById(clientId) {
    return this.clientSessionModel.findOne({ clientId });
  }
}
