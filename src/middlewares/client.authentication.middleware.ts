import { HttpException } from "@nestjs/common/exceptions/http.exception";
import { NestMiddleware, HttpStatus, Injectable } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { UserService } from "../user/user.service";
import { AuthService } from "../auth/services/auth.service";

@Injectable()
export class ClientAuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService, private readonly userService: UserService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const accessToken = req.headers["access-token"];

    if (accessToken) {
      await this.authService.verifyToken(req);
      const userId = req.user.userId;

      const user = await this.userService._findById(userId);

      if (!user) {
        throw new HttpException("User not found.", HttpStatus.UNAUTHORIZED);
      }
      next();
    } else {
      throw new HttpException("Not authorized.", HttpStatus.UNAUTHORIZED);
    }
  }
}
