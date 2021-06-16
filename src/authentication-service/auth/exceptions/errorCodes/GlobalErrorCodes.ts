export class GlobalErrorCodes {
  static readonly INTERNAL_ERROR = new GlobalErrorCodes('INTERNAL_ERROR', 600, 'Internal Failure!');
  static readonly EMPTY_ERROR = new GlobalErrorCodes('EMPTY_ERROR', 601, "This field mustn't be empty.");
  static readonly NEGATIVE_NUMBER = new GlobalErrorCodes('NEGATIVE_NUMBER', 602, "This field can't include negative numbers.");

  private constructor(private readonly key: string, public readonly code: number, public readonly value: string) {}

  toString() {
    return this.key;
  }
}
