import { HttpStatus, Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { InjectModel } from "@nestjs/mongoose";
import { Observable } from "rxjs";
import { Model } from "mongoose";
import { TokenErrorCodes } from "../exceptions/errorCodes/TokenErrorCodes";
import { RequestInfo } from "../user/interfaces/request-info.interface";
import { ClientJWTData, JWTTokens } from "./interfaces/jwt-token.interface";
import { SessionData } from "./interfaces/session-data.interface";
import { RefreshSessionDocument } from "./refreshSession.schema";
import { RefreshSessionDto } from "./refreshSession.dto";

const jwt = require("jsonwebtoken");
const ms = require("ms");

@Injectable()
export class TokenService {
  constructor(
    @InjectModel("Refresh-Session")
    private readonly refreshSessionModel: Model<RefreshSessionDocument>
  ) {}

  async generateJWT(userId: string, sessionData: SessionData): Promise<JWTTokens> {
    try {
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
    } catch (e) {
      console.log(e.stack);
      throw new RpcException(e);
    }
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
    try {
      const { userAgent, ip, fingerprint } = sessionData;

      if (typeof refreshToken === "string") {
        refreshToken = refreshToken.split('"').join("");
      } else if (Array.isArray(refreshToken)) {
        throw new RpcException({
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
        throw new RpcException({
          key: "INVALID_REFRESH_SESSION",
          code: TokenErrorCodes.INVALID_REFRESH_SESSION.code,
          message: TokenErrorCodes.INVALID_REFRESH_SESSION.value
        });
      }

      if (Date.now() > rows.createdAt + rows.expiresIn) {
        throw new RpcException({
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
    } catch (e) {
      console.log(e.stack);
      throw new RpcException(e);
    }
  }

  async logout({ userId, ip, userAgent, fingerprint, refreshToken }: RequestInfo): Promise<HttpStatus | Observable<any> | RpcException> {
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
      return new RpcException(e);
    }
  }

  private async _addRefreshSession(refreshSessionDto: RefreshSessionDto) {
    if (await this._isValidSessionsCount(refreshSessionDto.userId)) {
      return this._addRefreshSessionRecord(refreshSessionDto);
    } else {
      await this._wipeAllUserRefreshSessions(refreshSessionDto.userId);
      return this._addRefreshSessionRecord(refreshSessionDto);
    }
  }

  private async _isValidSessionsCount(userId: string) {
    try {
      const sessionsCount = await this.refreshSessionModel
        .countDocuments({
          userId: userId
        })
        .exec();
      return sessionsCount < Number.parseInt(process.env.MAX_REFRESH_SESSIONS_COUNT);
    } catch (e) {
      console.log(e.stack);
      return new RpcException(e);
    }
  }

  private async _addRefreshSessionRecord(refreshSessionDto: RefreshSessionDto) {
    const refreshToken = await this._generateRefreshToken(refreshSessionDto.userId);

    try {
      refreshSessionDto.refreshToken = refreshToken;
      const createdRefreshSession = new this.refreshSessionModel(refreshSessionDto);
      await createdRefreshSession.save();
      return refreshToken;
    } catch (e) {
      console.log(e.stack);
    }
  }

  private async _wipeAllUserRefreshSessions(userId: string): Promise<boolean | Observable<any> | RpcException> {
    try {
      await this.refreshSessionModel
        .deleteMany({
          userId: userId
        })
        .exec();
      return true;
    } catch (e) {
      console.log(e.stack);
      return new RpcException(e);
    }
  }

  private async _generateAccessToken(userId): Promise<string> {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
      algorithm: "HS512",
      subject: userId.toString(),
      expiresIn: "10y"
    });
  }

  private async _generateRefreshToken(userId): Promise<string> {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
      algorithm: "HS512",
      subject: userId.toString(),
      expiresIn: "60d"
    });
  }

  private async _generateClientsAccessToken(clientId, ip): Promise<string> {
    return jwt.sign({ clientId, ip }, process.env.CLIENTS_JWT_SECRET, {
      algorithm: "HS512",
      subject: clientId.toString(),
      expiresIn: "1y"
    });
  }

  async generateClientsJWT(clientSession: ClientJWTData): Promise<string> {
    return await this._generateClientsAccessToken(clientSession.clientId, clientSession.ip);
  }
}
