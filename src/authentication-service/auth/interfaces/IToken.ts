import {JWTToken} from "./JWTToken";
import {User} from "./user.interface";
import {NextFunction, Request, Response} from "express";

export interface UserJWTData {
  userId: string;
  username: string;
}

export interface SessionData {
  ip: string;
  userAgent: string;
  fingerPrint: string;
}

export interface ClientJWTData {
  ip: string;
  clientId: string;
}

export interface IToken {
  generateJWT(res: Response, userData: UserJWTData, sessionData: SessionData): Promise<{ body, success, errors }>;
  
  refreshSession(req: Request, res: Response): Promise<{ body, success, errors }> | Promise<{ success, errors }>;
  
  verifyToken(req: Request, res: Response): Promise<{ errors }> | void;
  
  logout(req: Request, res: Response): Promise<{ success }> | void;
  
  _addRefreshSession(req: Request, res: Response): Promise<{ body, success, errors }>;
  
  _isValidSessionsCount(req: Request, res: Response): Promise<boolean>;
  
  _addRefreshSessionRecord(req: Request, res: Response): Promise<{ body, success, errors }>;
  
  _wipeAllUserRefreshSessions(req: Request, res: Response): Promise<boolean>;
  
  _verifySessionRefreshRequest(req: Request, res: Response): Promise<Error> | Promise<boolean>;
  
  _generateAccessToken(req: Request, res: Response): Promise<any>;
  
  _generateRefreshToken(req: Request, res: Response): Promise<any>;
  
  _getRefreshSession(req: Request, res: Response): Promise<string[]>;
  
  _generateClientsAccessToken(clientId: string, ip: string): Promise<string>;
  
  verifyClientsToken(req: Request, res: Response, next: NextFunction): Promise<{ errors }> | Promise<void>;
  
  generateClientsJWT(res: Response, clientSession: ClientJWTData): Promise<{ token: string, success: boolean }>;
}
