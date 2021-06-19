export class TokenErrorCodes {
  static readonly USER_TOKEN_NOT_PROVIDED = new TokenErrorCodes(
    'USER_TOKEN_NOT_PROVIDED',
    700,
    "User's access-token was not provided. Can be solved by re-login."
  );
  static readonly CLIENT_TOKEN_NOT_PROVIDED = new TokenErrorCodes(
    'CLIENT_TOKEN_NOT_PROVIDED',
    701,
    "Client's access-token was not provided. Can be solved by reloading app."
  );
  static readonly REFRESH_TOKEN_NOT_PROVIDED = new TokenErrorCodes(
    'REFRESH_TOKEN_NOT_PROVIDED',
    702,
    "User's refresh-token is not provided. Can be solved by re-login."
  );
  static readonly SESSION_EXPIRED = new TokenErrorCodes('SESSION_EXPIRED', 703, "User's session has expired. Can be solved by re-login.");
  static readonly REFRESH_TOKEN_EXPIRED = new TokenErrorCodes(
    'REFRESH_TOKEN_EXPIRED',
    704,
    "User's refresh-token has expired. Can be solved by re-login."
  );

  private constructor(private readonly key: string, public readonly code, public readonly value: any) {}

  toString() {
    return this.key;
  }
}
