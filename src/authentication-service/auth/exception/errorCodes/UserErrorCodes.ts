export class UserErrorCodes {
  static readonly USER_TOKEN_NOT_PROVIDED  = new UserErrorCodes('USER_TOKEN_NOT_PROVIDED', 'User\'s token was not provided. Can be solved by re-login.');
  static readonly CLIENT_TOKEN_NOT_PROVIDED  = new UserErrorCodes('CLIENT_TOKEN_NOT_PROVIDED', 'Client\'s token was not provided. Can be solved by reloading app.');
  static readonly REFRESH_TOKEN_NOT_PROVIDED = new UserErrorCodes('REFRESH_TOKEN_NOT_PROVIDED', 'User\'s refresh token is not provided. Can be solved by re-login.');
  static readonly SESSION_EXPIRED  = new UserErrorCodes('SESSION_EXPIRED', 'User\'s session has expired. Can be solved by re-login.');
  static readonly REFRESH_TOKEN_EXPIRED = new UserErrorCodes('REFRESH_TOKEN_EXPIRED', 'User\'s refresh token has expired. Can be solved by re-login.');
  static readonly TOO_MANY_LOGIN_TRIES  = new UserErrorCodes('TOO_MANY_LOGIN_TRIES', 'User has ran over login attempts.');
  
  // private to disallow creating other instances of this type
  private constructor(private readonly key: string, public readonly value: any) {
  }
  
  toString() {
    return this.key;
  }
}
