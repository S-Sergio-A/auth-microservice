export class ValidationErrorCodes {
  static readonly INVALID_EMAIL = new ValidationErrorCodes("INVALID_EMAIL", 910, "There are no accounts with such email.");
  static readonly INVALID_USERNAME = new ValidationErrorCodes("INVALID_USERNAME", 911, "There are no accounts with such username.");
  static readonly INVALID_TEL_NUM = new ValidationErrorCodes("INVALID_TEL_NUM", 905, "There are no accounts with such phone number.");
  static readonly INVALID_PASSWORD = new ValidationErrorCodes("INVALID_PASSWORD", 912, "Incorrect password.");

  static readonly OLD_EMAIL_DOES_NOT_MATCH = new ValidationErrorCodes(
    "OLD_EMAIL_DOES_NOT_MATCH",
    940,
    "This email doesn't match with your previous one."
  );
  static readonly OLD_USERNAME_DOES_NOT_MATCH = new ValidationErrorCodes(
    "OLD_USERNAME_DOES_NOT_MATCH",
    941,
    "This username doesn't match with your previous one."
  );
  static readonly OLD_TEL_NUM_DOES_NOT_MATCH = new ValidationErrorCodes(
    "OLD_TEL_NUM_DOES_NOT_MATCH",
    942,
    "This mobile phone number doesn't match with your previous one."
  );
  static readonly OLD_PASSWORD_DOES_NOT_MATCH = new ValidationErrorCodes(
    "OLD_PASSWORD_DOES_NOT_MATCH",
    943,
    "This password doesn't match with your previous one."
  );
  static readonly PASSWORDS_DOES_NOT_MATCH = new ValidationErrorCodes(
    "PASSWORDS_DOES_NOT_MATCH",
    944,
    "The password doesn't match with password verification."
  );

  static readonly EMAIL_ALREADY_EXISTS = new ValidationErrorCodes(
    "EMAIL_ALREADY_EXISTS",
    950,
    "An account with the following email has been already signed up."
  );
  static readonly USERNAME_ALREADY_EXISTS = new ValidationErrorCodes(
    "USERNAME_ALREADY_EXISTS",
    951,
    "An account with the following username has been already signed up."
  );
  static readonly TEL_NUM_ALREADY_EXISTS = new ValidationErrorCodes(
    "TEL_NUM_ALREADY_EXISTS",
    952,
    "An account with the following phone number has been already signed up."
  );

  private constructor(private readonly key: string, public readonly code: number, public readonly value: string) {}

  toString() {
    return this.key;
  }
}
