import { HttpStatus, Injectable, UseFilters } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Request } from "express";
import { Model } from "mongoose";
import { GlobalErrorCodes } from "../../exceptions/errorCodes/GlobalErrorCodes";
import { RequestBodyException } from "../../exceptions/RequestBody.exception";
import { TokenErrorCodes } from "../../exceptions/errorCodes/TokenErrorCodes";
import { InternalException } from "../../exceptions/Internal.exception";
import { RefreshSessionDto } from "../dto/refresh-session.dto";
import { ClientJWTData, JWTTokens } from "./interfaces/jwt-token.interface";
import { SessionData } from "./interfaces/session-data.interface";
import { RefreshSessionDocument } from "../schemas/refreshSession.schema";
import { RequestBodyExceptionFilter } from "../../exceptions/filters/RequestBody.exception-filter";

const jwt = require("jsonwebtoken");
const ms = require("ms");

const MAX_REFRESH_SESSIONS_COUNT = 5;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel("Refresh-Session")
    private readonly refreshSessionModel: Model<RefreshSessionDocument>
  ) {}

  async generateJWT(userId: string, sessionData: SessionData): Promise<JWTTokens> {
    const { userAgent, ip, fingerprint } = sessionData;

    return {
      accessToken: await this._generateAccessToken(userId),
      refreshToken: await this._addRefreshSession({
        userId,
        ip,
        userAgent,
        fingerprint,
        createdAt: Date.now(),
        expiresIn: ms(process.env.JWT_REFRESH_EXPIRATION_TIME)
      })
    };
  }

  async refreshSession(req: Request, sessionData: SessionData): Promise<JWTTokens> {
    const { userAgent, ip, fingerprint } = sessionData;

    let token: string;
    let refreshToken: string;
    const user = req.user;

    if (typeof req.headers["access-token"] === "string") {
      token = req.headers["access-token"].split('"').join("") || req.cookies.token;
    } else if (Array.isArray(req.headers["access-token"])) {
      throw new RequestBodyException({
        key: "USER_TOKEN_NOT_PROVIDED",
        code: TokenErrorCodes.USER_TOKEN_NOT_PROVIDED.code,
        message: TokenErrorCodes.USER_TOKEN_NOT_PROVIDED.value
      });
    }

    if (typeof req.headers["refresh-token"] === "string") {
      refreshToken = req.headers["refresh-token"].split('"').join("") || req.cookies.refreshToken;
    } else if (Array.isArray(req.headers["access-token"])) {
      throw new RequestBodyException({
        key: "REFRESH_TOKEN_NOT_PROVIDED",
        code: TokenErrorCodes.REFRESH_TOKEN_NOT_PROVIDED.code,
        message: TokenErrorCodes.REFRESH_TOKEN_NOT_PROVIDED.value
      });
    }

    const rows = await this.refreshSessionModel.findOne({
      userId: user.userId
    });

    if (Date.now() > rows.createdAt + rows.expiresIn) {
      throw new RequestBodyException({
        key: "SESSION_EXPIRED",
        code: TokenErrorCodes.SESSION_EXPIRED.code,
        message: TokenErrorCodes.SESSION_EXPIRED.value
      });
    }

    if (rows.fingerprint !== rows) {
      throw new RequestBodyException({
        key: "INVALID_REFRESH_SESSION",
        code: TokenErrorCodes.INVALID_REFRESH_SESSION.code,
        message: TokenErrorCodes.INVALID_REFRESH_SESSION.value
      });
    }

    const newSessionData = {
      ip,
      userAgent,
      fingerprint,
      createdAt: Date.now(),
      expiresIn: Date.now() + ms(process.env.JWT_REFRESH_EXPIRATION_TIME)
    };

    return await this.generateJWT(user.userId, newSessionData);
  }

  async verifyToken(req: Request) {
    let token: string;

    if (typeof req.headers["access-token"] === "string") {
      token = req.headers["access-token"].split('"').join("") || req.cookies.token;
    } else if (Array.isArray(req.headers["access-token"])) {
      throw new RequestBodyException({
        key: "USER_TOKEN_NOT_PROVIDED",
        code: TokenErrorCodes.USER_TOKEN_NOT_PROVIDED.code,
        message: TokenErrorCodes.USER_TOKEN_NOT_PROVIDED.value
      });
    }

    if (token) {
      try {
        const decrypt = await jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
          userId: decrypt.userId
        };
      } catch (e) {
        console.log(e.stack);
        throw new RequestBodyException({
          key: "SESSION_EXPIRED",
          code: TokenErrorCodes.SESSION_EXPIRED.code,
          message: TokenErrorCodes.SESSION_EXPIRED.value
        });
      }
    }
  }

  async logout(req: Request): Promise<HttpStatus> {
    const user = req.user;

    try {
      await this.refreshSessionModel
        .deleteOne({
          userId: user.userId,
          ip: req.socket.remoteAddress
        })
        .exec();
      return HttpStatus.OK;
    } catch (e) {
      console.log(e.stack);
      throw new InternalException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  // refreshSession - data from frontend
  private async _addRefreshSession(refreshSessionDto: RefreshSessionDto) {
    if (await this._isValidSessionsCount(refreshSessionDto.userId)) {
      return this._addRefreshSessionRecord(refreshSessionDto);
    } else {
      await this._wipeAllUserRefreshSessions(refreshSessionDto.userId);
      return this._addRefreshSessionRecord(refreshSessionDto);
    }
  }

  // проверка лимита возможных активных сессий
  private async _isValidSessionsCount(userId: string) {
    try {
      const sessionsCount = await this.refreshSessionModel
        .countDocuments({
          userId: userId
        })
        .exec();
      return sessionsCount < MAX_REFRESH_SESSIONS_COUNT;
    } catch (e) {
      console.log(e.stack);
      throw new InternalException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  // создание новой записи с информацией о сессии
  private async _addRefreshSessionRecord(refreshSessionDto: RefreshSessionDto) {
    const refreshToken = await this._generateRefreshToken(refreshSessionDto.userId);

    try {
      refreshSessionDto.refreshToken = refreshToken;
      const createdRefreshSession = new this.refreshSessionModel(refreshSessionDto);
      await createdRefreshSession.save();
      return refreshToken;
    } catch (e) {
      console.log(e.stack);
      throw new InternalException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  // удаление всех сессий по id пользователя
  private async _wipeAllUserRefreshSessions(userId: string) {
    try {
      await this.refreshSessionModel
        .deleteMany({
          userId: userId
        })
        .exec();
      return true;
    } catch (e) {
      console.log(e.stack);
      throw new InternalException({
        key: "INTERNAL_ERROR",
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  private async _generateAccessToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
      algorithm: "HS512",
      subject: userId.toString(),
      expiresIn: "15m"
    });
  }

  private async _generateRefreshToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
      algorithm: "HS512",
      subject: userId.toString(),
      expiresIn: "60d"
    });
  }

  /////////////----CLIENT----\\\\\\\\\\\\\
  private async _generateClientsAccessToken(clientId, ip) {
    return jwt.sign({ clientId, ip }, process.env.CLIENTS_JWT_SECRET, {
      algorithm: "HS512",
      subject: clientId.toString(),
      expiresIn: "60d"
    });
  }

  async verifyClientsToken(req: Request) {
    let token: string;

    if (typeof req.headers["client-token"] === "string") {
      token = req.headers["client-token"].split('"').join("") || req.cookies.clientsToken;
    } else if (Array.isArray(req.headers["access-token"])) {
      throw new RequestBodyException({
        key: "CLIENT_TOKEN_NOT_PROVIDED",
        code: TokenErrorCodes.CLIENT_TOKEN_NOT_PROVIDED.code,
        message: TokenErrorCodes.CLIENT_TOKEN_NOT_PROVIDED.value
      });
    }

    if (token) {
      try {
        const decrypt = await jwt.verify(token, process.env.CLIENTS_JWT_SECRET);
        req.client = {
          ip: decrypt.ip,
          clientId: decrypt.clientId
        };
      } catch (e) {
        console.log(e.stack);
        throw new InternalException({
          key: "INTERNAL_ERROR",
          code: GlobalErrorCodes.INTERNAL_ERROR.code,
          message: GlobalErrorCodes.INTERNAL_ERROR.value
        });
      }
    }
  }

  async generateClientsJWT(clientSession: ClientJWTData) {
    const token = await this._generateClientsAccessToken(clientSession.clientId, clientSession.ip);
    return { token, success: true };
  }
}
