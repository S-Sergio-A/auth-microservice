import { NextFunction, Request, Response } from 'express';
import { RefreshSessionSchema } from '../schemas/refreshSession.schema';
import { ClientJWTData, JWTTokens, UserJWTData } from './jwt-token.interface';
import {SessionData} from "./session-data.interface";
import {RefreshSessionDto} from "../dto/refresh-session.dto";

export interface TokenService {
  generateJWT(
    userData: UserJWTData,
    sessionData: SessionData,
  ): Promise<{ body: JWTTokens; success: boolean; errorCode: number }>;

  refreshSession(
    req: Request,
    res: Response,
  ): Promise<{ body; success; errorCode }> | Promise<{ success; errorCode }>;

  verifyToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<{ errorCode }> | void;

  logout(req: Request, res: Response): Promise<{ success }> | void;

  _addRefreshSession(
    refreshSessionDto: RefreshSessionDto
  ): Promise<{ body; success; errorCode }>;

  _isValidSessionsCount(userId: string): Promise<boolean>;

  _addRefreshSessionRecord(
    userId: string,
    sessionData: SessionData,
  ): Promise<{ body; success; errorCode }>;

  _wipeAllUserRefreshSessions(userId: string): Promise<boolean>;

  _verifySessionRefreshRequest(
    oldSessionData: SessionData,
    newFingerprint: string,
  ): Promise<boolean | Error>;

  _generateAccessToken(req: Request, res: Response): Promise<any>;

  _generateRefreshToken(req: Request, res: Response): Promise<any>;

  _getRefreshSession(
    req: Request,
    res: Response,
  ): Promise<typeof RefreshSessionSchema[]>;

  _generateClientsAccessToken(clientId: string, ip: string): Promise<string>;

  verifyClientsToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<{ errorCode }> | Promise<void>;

  generateClientsJWT(
    res: Response,
    clientSession: ClientJWTData,
  ): Promise<{ token: string; success: boolean }>;
}
