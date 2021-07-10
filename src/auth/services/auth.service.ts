import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Request } from "express";
import { Model } from "mongoose";
import { GlobalErrorCodes } from "../../exceptions/errorCodes/GlobalErrorCodes";
import { RequestBodyException } from "../../exceptions/RequestBody.exception";
import { TokenErrorCodes } from "../../exceptions/errorCodes/TokenErrorCodes";
import { InternalException } from "../../exceptions/Internal.exception";
import { RefreshSessionDocument } from "../schemas/refreshSession.schema";
import { RefreshSessionDto } from "../dto/refresh-session.dto";
import { ClientJWTData, JWTTokens } from "./interfaces/jwt-token.interface";
import { SessionData } from "./interfaces/session-data.interface";
import { RequestInfo } from "../../../../public-api/src/interfaces/request-info.interface";

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

  async refreshSession(
    {
      refreshToken,
      userId
    }: {
      refreshToken: string;
      userId: string;
    },
    sessionData: SessionData
  ): Promise<JWTTokens> {
    const { userAgent, ip, fingerprint } = sessionData;

    if (typeof refreshToken === "string") {
      refreshToken = refreshToken.split('"').join("");
    } else if (Array.isArray(refreshToken)) {
      throw new RequestBodyException({
        key: "REFRESH_TOKEN_NOT_PROVIDED",
        code: TokenErrorCodes.REFRESH_TOKEN_NOT_PROVIDED.code,
        message: TokenErrorCodes.REFRESH_TOKEN_NOT_PROVIDED.value
      });
    }

    const rows = await this.refreshSessionModel.findOne({
      userId,
      ip,
      userAgent,
      fingerprint,
      refreshToken
    });

    if (!rows) {
      throw new RequestBodyException({
        key: "INVALID_REFRESH_SESSION",
        code: TokenErrorCodes.INVALID_REFRESH_SESSION.code,
        message: TokenErrorCodes.INVALID_REFRESH_SESSION.value
      });
    }

    if (Date.now() > rows.createdAt + rows.expiresIn) {
      throw new RequestBodyException({
        key: "SESSION_EXPIRED",
        code: TokenErrorCodes.SESSION_EXPIRED.code,
        message: TokenErrorCodes.SESSION_EXPIRED.value
      });
    }

    const newSessionData = {
      ip,
      userAgent,
      fingerprint,
      createdAt: Date.now(),
      expiresIn: Date.now() + ms(process.env.JWT_REFRESH_EXPIRATION_TIME)
    };

    return await this.generateJWT(userId, newSessionData);
  }

  async logout({ userId, ip, userAgent, fingerprint, refreshToken }: RequestInfo): Promise<HttpStatus> {
    try {
      await this.refreshSessionModel
        .deleteOne({
          userId,
          ip,
          userAgent,
          fingerprint,
          refreshToken
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

  async generateClientsJWT(clientSession: ClientJWTData) {
    return await this._generateClientsAccessToken(clientSession.clientId, clientSession.ip);
  }
}
