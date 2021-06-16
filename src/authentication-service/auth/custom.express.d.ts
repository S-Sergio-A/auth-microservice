import { ClientJWTData, UserJWTData } from './services/token/interfaces/jwt-token.interface';

declare global {
  namespace Express {
    export interface Request {
      user?: UserJWTData;
      client?: ClientJWTData;
    }
  }
}
