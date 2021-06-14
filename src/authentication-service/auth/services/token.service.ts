import { NextFunction, Request, Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { config } from 'dotenv';
import { TokenErrorCodes } from '../exception/errorCodes/TokenErrorCodes';
import {ClientJWTData, JWTTokens, UserJWTData} from "../interfaces/jwt-token.interface";
import {RefreshSession} from "../interfaces/refresh-session.interface";
import {SessionData} from "../interfaces/session-data.interface";
import {RefreshSessionDto} from "../dto/refresh-session.dto";

const jwt = require('jsonwebtoken');
const ms = require('ms');

config({ path: './../../.env' });

const MAX_REFRESH_SESSIONS_COUNT = 5;

export class TokenService implements TokenService {
  constructor(
    @InjectModel('RefreshSession')
    private readonly refreshSessionModel: Model<RefreshSession>,
  ) {}

  async generateJWT(
    userData: UserJWTData,
    sessionData: SessionData,
  ): Promise<{ body: JWTTokens; success: boolean; errorCode: number }> {
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
        expiresIn: ms('30d'),
      }),
      // process.env.JWT_REFRESH_EXPIRATION_TIME
    };

    console.log(body);

    return { body, success: true, errorCode: null };
  }

  async refreshSession(req: Request, res: Response) {
    let token: string;
    let refreshToken: string;
    const user = req.user;
    const fingerprint = req.body.fingerprint;

    if (typeof req.headers['token'] === 'string') {
      token = req.headers['token'].split('"').join('') || req.cookies.token;
    } else if (Array.isArray(req.headers['token'])) {
      // throw new Error()
      return {
        success: false,
        errorCode: TokenErrorCodes.USER_TOKEN_NOT_PROVIDED.code,
      };
    }

    if (typeof req.headers['refresh-token'] === 'string') {
      refreshToken =
        req.headers['refresh-token'].split('"').join('') ||
        req.cookies.refreshToken;
    } else if (Array.isArray(req.headers['token'])) {
      // throw new Error()
      return {
        success: false,
        errorCode: TokenErrorCodes.REFRESH_TOKEN_NOT_PROVIDED.code,
      };
    }

    if (token && refreshToken) {
      try {
        const rows = await this._getRefreshSession(user);
        if (await this._verifySessionRefreshRequest(rows[0], fingerprint)) {
          const userData = {
            userId: user.userId,
          };

          const sessionData = {
            ip: req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            fingerprint: fingerprint,
            createdAt: Date.now(),
            expiresIn: ms(process.env.JWT_REFRESH_EXPIRATION_TIME),
          };

          return this.generateJWT(userData, sessionData);
        } else {
          console.log(
            'Session verification failure in TokenService.refreshSession()',
          );
          return {
            success: false,
            errorCode: TokenErrorCodes.SESSION_EXPIRED.code,
          };
        }
      } catch (e) {
        console.log(
          'Querying failure in TokenService.refreshSession()\n\n' + e.stack,
        );
        return {
          success: false,
          errorCode: TokenErrorCodes.REFRESH_TOKEN_EXPIRED.code,
        };
      }
    } else {
      // throw new Error();
      return {
        success: false,
        errorCode: [TokenErrorCodes.USER_TOKEN_NOT_PROVIDED.code],
      };
    }
  }

  async verifyToken(req: Request, res: Response, next: NextFunction) {
    let token: string;

    if (typeof req.headers['token'] === 'string') {
      token = req.headers['token'].split('"').join('') || req.cookies.token;
    } else if (Array.isArray(req.headers['token'])) {
      // throw new Error()
      return {
        success: false,
        errorCode: TokenErrorCodes.USER_TOKEN_NOT_PROVIDED.code,
      };
    }

    if (token) {
      try {
        const decrypt = await jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
          userId: decrypt.userId,
        };
        next();
      } catch (e) {
        console.log(e.stack);
        return {
          success: false,
          errorCode: TokenErrorCodes.SESSION_EXPIRED.code,
        };
      }
    }
  }

  async logout(req: Request, res: Response) {
    // const pool = db.pool;
    const user = req.user;
    // const sql = 'DELETE FROM refresh_sessions WHERE user_id = $1 AND ip = $2;';

    try {
      await this.refreshSessionModel
        .deleteOne({
          userId: user.userId,
          ip: req.socket.remoteAddress,
        })
        .exec();
      // await pool.query(sql, [user.userId, req.body.ip]);
      return { success: true };
      // res.status(200).json({success: true}).end();
    } catch (e) {
      console.log(
        'Internal failure in TokenService._wipeAllUserRefreshSessions()  \n\n' +
          e.stack,
      );
      return { success: false };
    }
  }

  // refreshSession - data from frontend
  async _addRefreshSession(refreshSessionDto: RefreshSessionDto) {
    if (await this._isValidSessionsCount(refreshSessionDto.userId)) {
      return this._addRefreshSessionRecord(refreshSessionDto);
    } else {
      await this._wipeAllUserRefreshSessions(refreshSessionDto.userId);
      return this._addRefreshSessionRecord(refreshSessionDto);
    }
  }

  // проверка лимита возможных активных сессий
  async _isValidSessionsCount(userId: string) {
    // const pool = db.pool;
    // const sql = 'SELECT COUNT(refresh_token) FROM refresh_sessions WHERE user_id = $1;';

    try {
      const a = await this.refreshSessionModel
        .count({
          userId: userId,
        })
        .exec();
      // const {rows} = await pool.query(sql, [userId]);
      // return rows[0] < MAX_REFRESH_SESSIONS_COUNT;
      return a < MAX_REFRESH_SESSIONS_COUNT;
    } catch (e) {
      console.log(
        'Internal failure in TokenService._isValidSessionsCount()  \n\n' +
          e.stack,
      );
    }
  }

  // создание новой записи с информацией о сессии
  async _addRefreshSessionRecord(refreshSessionDto: RefreshSessionDto) {
    // const pool = db.pool;
    const refreshToken = await this._generateRefreshToken(refreshSessionDto.userId);
    // const sql = 'INSERT INTO refresh_sessions (user_id, refresh_token, user_agent, ip, expires_in, created_at, fingerprint) VALUES ($1, $2, $3, $4, $5, $6, $7);';

    try {
      const createdRefreshSession = new this.refreshSessionModel(refreshSessionDto);
      await createdRefreshSession.save();
      // await pool.query(sql, [userId, refreshToken, sessionData.userAgent || 'test-agent', sessionData.ip || 'test-ip', sessionData.expiresIn, sessionData.createdAt, sessionData.fingerprint]);
      return refreshToken;
    } catch (e) {
      console.log(
        'Internal failure in TokenService._addRefreshSession()  \n\n' + e.stack,
      );
      return null;
    }
  }

  // удаление всех сессий по id пользователя
  async _wipeAllUserRefreshSessions(userId: string) {
    // const pool = db.pool;
    // const sql = 'DELETE FROM refresh_sessions WHERE user_id = $1;';

    try {
      await this.refreshSessionModel
        .deleteMany({
          userId: userId,
        })
        .exec();
      // await pool.query(sql, [userId]);
      return true;
    } catch (e) {
      console.log(
        'Internal failure in TokenService._wipeAllUserRefreshSessions()  \n\n' +
          e.stack,
      );
      return false;
    }
  }

  // проверка подлинности запроса на обновление сессии
  // (сравнивает текущий fingerprint/ip с тем, который записан в БД)
  async _verifySessionRefreshRequest(
    oldSessionData: SessionData,
    newFingerprint: string,
  ) {
    const currentTime = Date.now();
    if (currentTime > oldSessionData.createdAt + oldSessionData.expiresIn)
      return new Error(TokenErrorCodes.SESSION_EXPIRED.value);
    // if (oldRefreshSessionData.ip !== newFingerprint) return new Error(errorCode.INVALID_REFRESH_SESSION.toString());
    if (oldSessionData.fingerprint !== newFingerprint)
      return new Error(TokenErrorCodes.REFRESH_TOKEN_EXPIRED.value);
    return true;
  }

  async _generateAccessToken(userId) {
    return jwt.sign({ userId }, 'process.env.JWT_SECRET', {
      algorithm: 'HS512',
      subject: userId.toString(),
      expiresIn: '15m',
    });
  }

  async _generateRefreshToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
      algorithm: 'HS512',
      subject: userId.toString(),
      expiresIn: '60d',
    });
  }

  async _getRefreshSession(userId) {
    // const pool = db.pool;
    // const sql = 'SELECT id, user_id as "userId", refresh_token as "refreshToken", user_agent AS "userAgent", ip, expires_in AS "expiresIn", created_at AS "createdAt", fingerprint FROM refresh_sessions WHERE user_id = $1;';

    try {
      // const {rows} = await pool.query(sql, [userId]);
      return await this.refreshSessionModel
        .find({
          userId: userId,
        })
        .exec();
    } catch (e) {
      console.log(
        'Internal failure in TokenService.getRefreshSession()  \n\n' + e.stack,
      );
      return null;
    }
  }

  /////////////----CLIENT----\\\\\\\\\\\\\
  async _generateClientsAccessToken(clientId, ip) {
    return jwt.sign({ clientId, ip }, process.env.CLIENTS_JWT_SECRET, {
      algorithm: 'HS512',
      subject: clientId.toString(),
      expiresIn: '60d',
    });
  }

  async verifyClientsToken(req: Request, res: Response, next: NextFunction) {
    let token: string;

    if (typeof req.headers['client-token'] === 'string') {
      token =
        req.headers['client-token'].split('"').join('') ||
        req.cookies.clientsToken;
    } else if (Array.isArray(req.headers['token'])) {
      throw new Error();
    }

    if (token) {
      try {
        const decrypt = await jwt.verify(token, process.env.CLIENTS_JWT_SECRET);
        req.client = {
          ip: decrypt.ip,
          clientId: decrypt.clientId,
        };
        next();
      } catch (e) {
        console.log(e.stack);
        throw new Error();
        // return res.status(200).json({errors: {code: errorCode.TOKEN_NOT_PROVIDED}}).end();
      }
    }
  }

  async generateClientsJWT(res: Response, clientSession: ClientJWTData) {
    const token = await this._generateClientsAccessToken(
      clientSession.clientId,
      clientSession.ip,
    );
    return { token, success: true };
  }
}
