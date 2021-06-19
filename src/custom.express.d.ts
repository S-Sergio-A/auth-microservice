import { ClientJWTData } from './auth/services/interfaces/jwt-token.interface';

declare global {
  namespace Express {
    export interface Request {
      user?: { userId: string };
      client?: ClientJWTData;
    }
  }
}
