import { HttpException } from "@nestjs/common/exceptions/http.exception";
import { NestMiddleware, HttpStatus, Injectable } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { AuthService } from "../auth/services/auth.service";
import { ClientService } from "../client/client.service";

@Injectable()
export class ClientAuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService, private readonly clientService: ClientService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const clientToken = req.headers["client-token"];

    if (clientToken) {
      await this.authService.verifyClientsToken(req);
      const clientId = req.client.clientId;
      const client = await this.clientService._findById(clientId);

      if (!client) {
        throw new HttpException("Please, reload the page.", HttpStatus.UNAUTHORIZED);
      }
      next();
    } else {
      throw new HttpException("Please, reload the page.", HttpStatus.UNAUTHORIZED);
    }
  }
}
