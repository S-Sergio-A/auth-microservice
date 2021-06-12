import dotenv from 'dotenv';
import ms from 'ms';
import {connect} from '../config/mongo.config';
import jwt from 'jsonwebtoken';
import {ClientJWTData, IToken, UserJWTData} from "../interfaces/IToken";
import {NextFunction, Request, Response} from "express";

dotenv.config({path: './../../.env'});

const MAX_REFRESH_SESSIONS_COUNT = 5;

export class TokenService implements IToken {
  
  async generateJWT(res, {userId, username}, {userAgent, ip, fingerPrint}) {
    const body = [
      {token: await this._generateAccessToken(userId, username)},
      {refreshToken: await this._addRefreshSession({userId, username}, {userAgent, ip, fingerPrint})}
    ];
    
    return {body, success: true, errors: null};
  }
  
  async refreshSession(req: Request, res: Response) {
    let token: string;
    let reqRefreshToken: string;
    const user = req.user;
    const fingerprint = req.body.fingerprint;
    
    if (typeof req.headers['token'] === 'string') {
      token = req.headers['token'].split('"').join('') || req.cookies.token;
    } else if (Array.isArray(req.headers['token'])) {
      throw new Error()
    }
    
    if (typeof req.headers['refresh-token'] === 'string') {
      reqRefreshToken = req.headers['refresh-token'].split('"').join('') || req.cookies.refreshToken;
    } else if (Array.isArray(req.headers['token'])) {
      throw new Error()
      // errors: {
      //   errorCode: errorCodes.REFRESH_TOKEN_NOT_PROVIDED
      // }
      
    }
    
    try {
      const rows = await this._getRefreshSession(user);
      if (await this._verifySessionRefreshRequest(rows[0], fingerprint)) {
        const userData = {
          userId: user.userId,
          email: user.username,
        };
        
        const requestData = {
          ip: req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          fingerprint: fingerprint
        };
        
        return this.generateJWT(res, userData, requestData);
      } else {
        console.log('Session verification failure in TokenService.refreshSession()');
        return {
          success: false,
          errors: {code: errorCodes.SESSION_EXPIRED}
        };
      }
    } catch (e) {
      console.log('Querying failure in TokenService.refreshSession()\n\n' + e.stack);
      return {success: false, errors: {code: 500}};
    }
  }
  
  async verifyToken(req, res, next) {
    let token = req.headers['token'].split('"').join('') || req.cookies.token;
    
    if (!token) {
      return res.status(200).json(
        // {errors: {code: errorCodes.TOKEN_NOT_PROVIDED}}
      ).end();
    } else {
      try {
        const decrypt = await jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
          userId: decrypt.userId,
          email: decrypt.email,
          cartId: decrypt.cartId
        };
        next();
      } catch (e) {
        console.log(e.stack);
        return res.status(200).json(
          // {errors: {code: errorCodes.SESSION_EXPIRED}}
        ).end();
      }
    }
  }
  
  async logout(req, res) {
    const pool = db.pool;
    const user = req.user;
    const sql = 'DELETE FROM refresh_sessions WHERE user_id = $1 AND ip = $2;';
    
    try {
      await pool.query(sql, [user.userId, req.body.ip]);
      res.status(200).json({success: true}).end();
    } catch (e) {
      console.log('Internal failure in TokenService._wipeAllUserRefreshSessions()  \n\n' + e.stack);
      res.status(200).json({success: false}).end();
    }
  }

// refreshSession - data from frontend
  async _addRefreshSession(refreshSessionData, requestData) {
    if (await this._isValidSessionsCount(refreshSessionData.userId)) {
      return this._addRefreshSessionRecord(refreshSessionData, requestData);
    } else {
      await this._wipeAllUserRefreshSessions(refreshSessionData.userId);
      return this._addRefreshSessionRecord(refreshSessionData, requestData);
    }
  }

// проверка лимита возможных активных сессий
  async _isValidSessionsCount(userId) {
    const pool = db.pool;
    const sql = 'SELECT COUNT(refresh_token) FROM refresh_sessions WHERE user_id = $1;';
    
    try {
      const {rows} = await pool.query(sql, [userId]);
      return rows[0] < MAX_REFRESH_SESSIONS_COUNT;
    } catch (e) {
      console.log('Internal failure in TokenService._isValidSessionsCount()  \n\n' + e.stack);
    }
  }

// создание новой записи с информацией о сессии
  async _addRefreshSessionRecord(refreshSessionData, requestData) {
    const pool = db.pool;
    const refreshToken = await this._generateRefreshToken(refreshSessionData.userId);
    const expiresIn = ms(process.env.JWT_REFRESH_EXPIRATION_TIME);
    const sql = 'INSERT INTO refresh_sessions (user_id, refresh_token, user_agent, ip, expires_in, created_at, fingerprint) VALUES ($1, $2, $3, $4, $5, $6, $7);';
    
    try {
      await pool.query(sql, [refreshSessionData.userId, refreshToken, requestData.userAgent || 'test-agent', requestData.ip || 'test-ip', expiresIn, Date.now(), requestData.fingerprint]);
      return refreshToken;
    } catch (e) {
      console.log('Internal failure in TokenService._addRefreshSession()  \n\n' + e.stack);
      return null;
    }
    // for better performance store refresh sessions in Redis persistence
  }

// удаление всех сессий по id пользователя
  async _wipeAllUserRefreshSessions(userId) {
    const pool = db.pool;
    const sql = 'DELETE FROM refresh_sessions WHERE user_id = $1;';
    
    try {
      await pool.query(sql, [userId]);
      return true;
    } catch (e) {
      console.log('Internal failure in TokenService._wipeAllUserRefreshSessions()  \n\n' + e.stack);
      return false;
    }
  }

// проверка подлинности запроса на обновление сессии
// (сравнивает текущий fingerprint/ip с тем, который записан в БД)
  async _verifySessionRefreshRequest(oldRefreshSessionData, newFingerprint) {
    const currentTime = Date.now();
    if (currentTime > oldRefreshSessionData.createdAt + oldRefreshSessionData.expiresIn) return new Error(errorCodes.SESSION_EXPIRED.toString());
    if (oldRefreshSessionData.ip !== newFingerprint) return new Error(errorCodes.INVALID_REFRESH_SESSION.toString());
    // if (oldRefreshSessionData.fingerprint !== newFingerprint) return reject(new Error(errorCodes.INVALID_REFRESH_SESSION.toString()));
    return true;
  }
  
  async _generateAccessToken(userId, email) {
    return jwt.sign({userId, email}, process.env.JWT_SECRET,
      {
        algorithm: 'HS512',
        subject: userId.toString(),
        expiresIn: '15m'
      });
  }
  
  async _generateRefreshToken(userId) {
    return jwt.sign({userId}, process.env.JWT_REFRESH_SECRET,
      {
        algorithm: 'HS512',
        subject: userId.toString(),
        expiresIn: '60d'
      });
  }
  
  async _getRefreshSession(userId) {
    const pool = db.pool;
    const sql = 'SELECT id, user_id as "userId", refresh_token as "refreshToken", user_agent AS "userAgent", ip, expires_in AS "expiresIn", created_at AS "createdAt", fingerprint FROM refresh_sessions WHERE user_id = $1;';
    
    try {
      const {rows} = await pool.query(sql, [userId]);
      return rows;
    } catch (e) {
      console.log('Internal failure in TokenService.getRefreshSession()  \n\n' + e.stack);
      return null;
    }
  }

/////////////----CLIENT----\\\\\\\\\\\\\
  async _generateClientsAccessToken(clientId, ip) {
    return jwt.sign({clientId, ip}, process.env.CLIENTS_JWT_SECRET,
      {
        algorithm: 'HS512',
        subject: clientId.toString(),
        expiresIn: '60d'
      });
  }
  
  async verifyClientsToken(req: Request, res: Response, next: NextFunction) {
    let token: string;
    
    if (typeof req.headers['client-token'] === 'string') {
      token = req.headers['client-token'].split('"').join('') || req.cookies.clientsToken;
    } else if (Array.isArray(req.headers['token'])) {
      throw new Error();
    }
    
    try {
      const decrypt = await jwt.verify(token, process.env.CLIENTS_JWT_SECRET);
      req.client = {
        ip: decrypt.ip,
        clientId: decrypt.clientId
      };
      next();
    } catch (e) {
      console.log(e.stack);
      throw new Error();
      // return res.status(200).json({errors: {code: errorCodes.TOKEN_NOT_PROVIDED}}).end();
    }
  }
  
  async generateClientsJWT(res: Response, clientSession: ClientJWTData) {
    const token = await this._generateClientsAccessToken(clientSession.clientId, clientSession.ip)
    return {token, success: true};
  }
}
