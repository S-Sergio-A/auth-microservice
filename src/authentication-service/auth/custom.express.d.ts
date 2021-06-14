import {ClientJWTData, UserJWTData} from "./interfaces/token.service.interface";

declare global {
  namespace Express {
    export interface Request {
      user?: UserJWTData;
      client?: ClientJWTData;
    }
  }
}
