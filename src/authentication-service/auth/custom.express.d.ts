import {ClientJWTData, UserJWTData} from "./interfaces/IToken";

declare global {
  namespace Express {
    export interface Request {
      user?: UserJWTData;
      client?: ClientJWTData;
    }
  }
}
