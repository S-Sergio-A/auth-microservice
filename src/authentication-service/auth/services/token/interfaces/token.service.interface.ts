import { NextFunction, Request, Response } from 'express';
import { ClientJWTData, JWTTokens, UserJWTData } from './jwt-token.interface';
import {SessionData} from "./session-data.interface";

export interface Token {
  generateJWT(
    userData: UserJWTData,
    sessionData: SessionData,
  ): Promise<{ body: JWTTokens; success: boolean; errorCode: number }>;

  refreshSession(
    req: Request,
  ): Promise<{ body; success; errorCode }> | Promise<{ success; errorCode }>;

  verifyToken(
    req: Request,
    next: NextFunction,
  ): Promise<void>;

  logout(req: Request, res: Response): Promise<{ success }> | void;

  verifyClientsToken(
    req: Request,
    next: NextFunction,
  ): Promise<void>;

  generateClientsJWT(
    clientSession: ClientJWTData,
  ): Promise<{ token: string; success: boolean }>;
}
