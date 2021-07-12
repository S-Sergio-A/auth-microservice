export class UserErrorCodes {
  static readonly USER_NOT_FOUND = new UserErrorCodes("USER_NOT_FOUND", 801, "This field mustn't be empty.");
  static readonly NOT_ACTIVE = new UserErrorCodes("NOT_ACTIVE", 802, "This account is not verified.");
  static readonly USER_HAS_BEEN_BLOCKED = new UserErrorCodes("USER_HAS_BEEN_BLOCKED", 803, "You have been blocked, try later.");

  private constructor(private readonly key: string, public readonly code: number, public readonly value: string) {}

  toString() {
    return this.key;
  }
}
