export class UserErrorCodes {
  static readonly USER_NOT_FOUND = new UserErrorCodes('USER_NOT_FOUND', 801, "This field mustn't be empty.");

  private constructor(private readonly key: string, public readonly code: number, public readonly value: string) {}

  toString() {
    return this.key;
  }
}
