import { NextFunction, Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { config } from 'dotenv';
import { ClientJWTData, JWTTokens, UserJWTData } from './interfaces/jwt-token.interface';
import { GlobalErrorCodes } from '../../exceptions/errorCodes/GlobalErrorCodes';
import { RequestBodyException } from '../../exceptions/RequestBody.exception';
import { TokenErrorCodes } from '../../exceptions/errorCodes/TokenErrorCodes';
import { RefreshSession } from '../../interfaces/refresh-session.interface';
import { InternalException } from '../../exceptions/Internal.exception';
import { SessionData } from './interfaces/session-data.interface';
import { RefreshSessionDto } from '../../dto/refresh-session.dto';
import { Token } from './interfaces/token.service.interface';

const jwt = require('jsonwebtoken');
const ms = require('ms');

config({ path: './../../.env' });

const MAX_REFRESH_SESSIONS_COUNT = 5;

export class TokenService implements Token {
  constructor(
    @InjectModel('RefreshSession')
    private readonly refreshSessionModel: Model<RefreshSession>
  ) {}

  async generateJWT(userData: UserJWTData, sessionData: SessionData): Promise<{ body: JWTTokens; success: boolean; errorCode: number }> {
    const { userId } = userData;
    const { userAgent, ip, fingerprint } = sessionData;

    const body = {
      token: await this._generateAccessToken(userId),
      refreshToken: await this._addRefreshSession({
        userId,
        ip,
        userAgent,
        fingerprint,
        createdAt: Date.now(),
        expiresIn: ms('30d')
      })
      // process.env.JWT_REFRESH_EXPIRATION_TIME
    };
    return { body, success: true, errorCode: null };
  }

  async refreshSession(req: Request) {
    let token: string;
    let refreshToken: string;
    const user = req.user;
    const fingerprint = req.body.fingerprint;

    if (typeof req.headers['token'] === 'string') {
      token = req.headers['token'].split('"').join('') || req.cookies.token;
    } else if (Array.isArray(req.headers['token'])) {
      throw new RequestBodyException({
        key: 'USER_TOKEN_NOT_PROVIDED',
        code: TokenErrorCodes.USER_TOKEN_NOT_PROVIDED.code,
        message: TokenErrorCodes.USER_TOKEN_NOT_PROVIDED.value
      });
    }

    if (typeof req.headers['refresh-token'] === 'string') {
      refreshToken = req.headers['refresh-token'].split('"').join('') || req.cookies.refreshToken;
    } else if (Array.isArray(req.headers['token'])) {
      throw new RequestBodyException({
        key: 'REFRESH_TOKEN_NOT_PROVIDED',
        code: TokenErrorCodes.REFRESH_TOKEN_NOT_PROVIDED.code,
        message: TokenErrorCodes.REFRESH_TOKEN_NOT_PROVIDED.value
      });
    }

    if (token && refreshToken) {
      try {
        const rows = await this._getRefreshSession(user);
        if (await this._verifySessionRefreshRequest(rows[0], fingerprint)) {
          const userData = {
            userId: user.userId
          };

          const sessionData = {
            ip: req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            fingerprint: fingerprint,
            createdAt: Date.now(),
            expiresIn: ms(process.env.JWT_REFRESH_EXPIRATION_TIME)
          };

          return this.generateJWT(userData, sessionData);
        } else {
          throw new RequestBodyException({
            key: 'SESSION_EXPIRED',
            code: TokenErrorCodes.SESSION_EXPIRED.code,
            message: TokenErrorCodes.SESSION_EXPIRED.value
          });
        }
      } catch (e) {
        throw new RequestBodyException({
          key: 'REFRESH_TOKEN_EXPIRED',
          code: TokenErrorCodes.REFRESH_TOKEN_EXPIRED.code,
          message: TokenErrorCodes.REFRESH_TOKEN_EXPIRED.value
        });
      }
    } else {
      throw new RequestBodyException({
        key: 'USER_TOKEN_NOT_PROVIDED',
        code: TokenErrorCodes.USER_TOKEN_NOT_PROVIDED.code,
        message: TokenErrorCodes.USER_TOKEN_NOT_PROVIDED.value
      });
    }
  }

  async verifyToken(req: Request, next: NextFunction) {
    let token: string;

    if (typeof req.headers['token'] === 'string') {
      token = req.headers['token'].split('"').join('') || req.cookies.token;
    } else if (Array.isArray(req.headers['token'])) {
      throw new RequestBodyException({
        key: 'USER_TOKEN_NOT_PROVIDED',
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
        next();
      } catch (e) {
        console.log(e.stack);
        throw new RequestBodyException({
          key: 'SESSION_EXPIRED',
          code: TokenErrorCodes.SESSION_EXPIRED.code,
          message: TokenErrorCodes.SESSION_EXPIRED.value
        });
      }
    }
  }

  async logout(req: Request) {
    const user = req.user;

    try {
      await this.refreshSessionModel
        .deleteOne({
          userId: user.userId,
          ip: req.socket.remoteAddress
        })
        .exec();
      return { success: true };
    } catch (e) {
      console.log(e.stack);
      throw new InternalException({
        key: 'INTERNAL_ERROR',
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
        .count({
          userId: userId
        })
        .exec();
      return sessionsCount < MAX_REFRESH_SESSIONS_COUNT;
    } catch (e) {
      console.log(e.stack);
      throw new InternalException({
        key: 'INTERNAL_ERROR',
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  // создание новой записи с информацией о сессии
  private async _addRefreshSessionRecord(refreshSessionDto: RefreshSessionDto) {
    const refreshToken = await this._generateRefreshToken(refreshSessionDto.userId);

    try {
      const createdRefreshSession = new this.refreshSessionModel(refreshSessionDto);
      await createdRefreshSession.save();
      return refreshToken;
    } catch (e) {
      console.log(e.stack);
      throw new InternalException({
        key: 'INTERNAL_ERROR',
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
        key: 'INTERNAL_ERROR',
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  // проверка подлинности запроса на обновление сессии
  // (сравнивает текущий fingerprint/ip с тем, который записан в БД)
  private async _verifySessionRefreshRequest(oldSessionData: SessionData, newFingerprint: string) {
    const currentTime = Date.now();
    if (currentTime > oldSessionData.createdAt + oldSessionData.expiresIn) {
      throw new RequestBodyException({
        key: 'SESSION_EXPIRED',
        code: TokenErrorCodes.SESSION_EXPIRED.code,
        message: TokenErrorCodes.SESSION_EXPIRED.value
      });
    }
    // if (oldRefreshSessionData.ip !== newFingerprint) return new Error(errorCode.INVALID_REFRESH_SESSION.toString());
    if (oldSessionData.fingerprint !== newFingerprint) {
      throw new RequestBodyException({
        key: 'REFRESH_TOKEN_EXPIRED',
        code: TokenErrorCodes.REFRESH_TOKEN_EXPIRED.code,
        message: TokenErrorCodes.REFRESH_TOKEN_EXPIRED.value
      });
    }
    return true;
  }

  private async _generateAccessToken(userId) {
    return jwt.sign({ userId }, 'process.env.JWT_SECRET', {
      algorithm: 'HS512',
      subject: userId.toString(),
      expiresIn: '15m'
    });
  }

  private async _generateRefreshToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
      algorithm: 'HS512',
      subject: userId.toString(),
      expiresIn: '60d'
    });
  }

  private async _getRefreshSession(userId) {
    try {
      return await this.refreshSessionModel
        .find({
          userId: userId
        })
        .exec();
    } catch (e) {
      console.log(e.stack);
      throw new InternalException({
        key: 'INTERNAL_ERROR',
        code: GlobalErrorCodes.INTERNAL_ERROR.code,
        message: GlobalErrorCodes.INTERNAL_ERROR.value
      });
    }
  }

  /////////////----CLIENT----\\\\\\\\\\\\\
  private async _generateClientsAccessToken(clientId, ip) {
    return jwt.sign({ clientId, ip }, process.env.CLIENTS_JWT_SECRET, {
      algorithm: 'HS512',
      subject: clientId.toString(),
      expiresIn: '60d'
    });
  }

  async verifyClientsToken(req: Request, next: NextFunction) {
    let token: string;

    if (typeof req.headers['client-token'] === 'string') {
      token = req.headers['client-token'].split('"').join('') || req.cookies.clientsToken;
    } else if (Array.isArray(req.headers['token'])) {
      throw new RequestBodyException({
        key: 'CLIENT_TOKEN_NOT_PROVIDED',
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
        next();
      } catch (e) {
        console.log(e.stack);
        throw new InternalException({
          key: 'INTERNAL_ERROR',
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
