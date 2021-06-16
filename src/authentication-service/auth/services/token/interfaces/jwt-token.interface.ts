export interface JWTToken {
  token: string;
}

export interface JWTTokens {
  token: string;
  refreshToken: string;
}

export interface ClientJWTData {
  ip: string;
  clientId: string;
}

export interface UserJWTData {
  userId: string;
}
