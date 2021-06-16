export class UserErrorCodes {
  static readonly USER_TOKEN_NOT_PROVIDED = new UserErrorCodes(
    'USER_TOKEN_NOT_PROVIDED',
    801,
    "User's token was not provided. Can be solved by re-login."
  );
  static readonly CLIENT_TOKEN_NOT_PROVIDED = new UserErrorCodes(
    'CLIENT_TOKEN_NOT_PROVIDED',
    802,
    "Client's token was not provided. Can be solved by reloading app."
  );
  static readonly REFRESH_TOKEN_NOT_PROVIDED = new UserErrorCodes(
    'REFRESH_TOKEN_NOT_PROVIDED',
    803,
    "User's refresh token is not provided. Can be solved by re-login."
  );
  static readonly SESSION_EXPIRED = new UserErrorCodes('SESSION_EXPIRED', 804, "User's session has expired. Can be solved by re-login.");
  static readonly REFRESH_TOKEN_EXPIRED = new UserErrorCodes(
    'REFRESH_TOKEN_EXPIRED',
    805,
    "User's refresh token has expired. Can be solved by re-login."
  );
  static readonly TOO_MANY_LOGIN_TRIES = new UserErrorCodes('TOO_MANY_LOGIN_TRIES', 806, 'User has ran over login attempts.');
  static readonly ACCOUNT_IS_NOT_ACTIVATED = new UserErrorCodes('ACCOUNT_IS_NOT_ACTIVATED', 807, 'User has ran over login attempts.');

  private constructor(private readonly key: string, public readonly code: number, public readonly value: string) {}

  toString() {
    return this.key;
  }
}
