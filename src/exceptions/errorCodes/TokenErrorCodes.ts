export class TokenErrorCodes {
  static readonly REFRESH_TOKEN_NOT_PROVIDED = new TokenErrorCodes(
    "REFRESH_TOKEN_NOT_PROVIDED",
    702,
    "User's refresh-token is not provided. Can be solved by re-login."
  );
  static readonly SESSION_EXPIRED = new TokenErrorCodes("SESSION_EXPIRED", 703, "User's session has expired. Can be solved by re-login.");
  static readonly INVALID_REFRESH_SESSION = new TokenErrorCodes(
    "INVALID_REFRESH_SESSION",
    705,
    "Refresh token is invalid. Can be solved by re-login."
  );

  private constructor(private readonly key: string, public readonly code, public readonly value: any) {}

  toString() {
    return this.key;
  }
}
