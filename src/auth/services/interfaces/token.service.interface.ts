import { NextFunction, Request, Response } from 'express';
import { ClientJWTData, JWTTokens } from './jwt-token.interface';
import {SessionData} from "./session-data.interface";
import { HttpStatus } from '@nestjs/common';

export interface Token {
  generateJWT(
    userId: string,
    sessionData: SessionData,
  ): Promise<JWTTokens>

  refreshSession(
    req: Request,
  ): Promise<JWTTokens>;

  _verifyToken(
    req: Request,
    next: NextFunction,
  ): void;

  logout(req: Request, res: Response): Promise<HttpStatus>;
  
  _verifyClientsToken(
    req: Request,
    next: NextFunction,
  ): Promise<void>;

  generateClientsJWT(
    clientSession: ClientJWTData,
  ): Promise<{ token: string; success: boolean }>;
}
