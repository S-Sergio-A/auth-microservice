export class ValidationErrorCodes {
  static readonly INVALID_CREATE_FIRST_NAME = new ValidationErrorCodes(
    'INVALID_CREATE_FIRST_NAME',
    900,
    "This first name doesn't match the rules."
  );
  static readonly INVALID_CREATE_LAST_NAME = new ValidationErrorCodes(
    'INVALID_CREATE_LAST_NAME',
    901,
    "This last name doesn't match the rules."
  );
  static readonly INVALID_CREATE_BIRTHDAY = new ValidationErrorCodes(
    'INVALID_CREATE_BIRTHDAY',
    902,
    "This last name doesn't match the rules."
  );
  static readonly INVALID_CREATE_EMAIL = new ValidationErrorCodes('INVALID_CREATE_EMAIL', 903, "This birthday doesn't match the rules.");
  static readonly INVALID_CREATE_USERNAME = new ValidationErrorCodes(
    'INVALID_CREATE_USERNAME',
    904,
    "This username doesn't match the rules."
  );
  static readonly INVALID_CREATE_TEL_NUM = new ValidationErrorCodes(
    'INVALID_CREATE_TEL_NUM',
    905,
    "This mobile phone number doesn't match the rules."
  );
  static readonly INVALID_CREATE_PASSWORD = new ValidationErrorCodes(
    'INVALID_CREATE_PASSWORD',
    906,
    "This password doesn't match the rules."
  );

  static readonly INVALID_EMAIL = new ValidationErrorCodes('INVALID_EMAIL', 910, 'There is no accounts with such email.');
  static readonly INVALID_USERNAME = new ValidationErrorCodes('INVALID_USERNAME', 911, 'There is no accounts with such username.');
  static readonly INVALID_PASSWORD = new ValidationErrorCodes('INVALID_PASSWORD', 912, 'Incorrect password.');
  static readonly INVALID_SUBJECT = new ValidationErrorCodes('INVALID_SUBJECT', 913, 'Incorrect subject.');

  static readonly INVALID_CREATE_EMAIL_LENGTH = new ValidationErrorCodes(
    'INVALID_CREATE_EMAIL_LENGTH',
    920,
    "This email length doesn't match the rules."
  );
  static readonly INVALID_CREATE_PASSWORD_LENGTH = new ValidationErrorCodes(
    'INVALID_CREATE_PASSWORD_LENGTH',
    921,
    "This password length doesn't match the rules."
  );
  static readonly INVALID_CREATE_USERNAME_LENGTH = new ValidationErrorCodes(
    'INVALID_CREATE_USERNAME_LENGTH',
    922,
    "This username length doesn't match the rules."
  );
  static readonly INVALID_CREATE_TEL_NUM_LENGTH = new ValidationErrorCodes(
    'INVALID_CREATE_TEL_NUM_LENGTH',
    923,
    "This mobile phone number length doesn't match the rules."
  );

  static readonly PASSWORD_NOT_ALL_REQUIRED_CHARACTERS = new ValidationErrorCodes(
    'PASSWORD_NOT_ALL_REQUIRED_CHARACTERS',
    930,
    "This password doesn't include all necessary characters."
  );
  static readonly FIRST_NAME_RESTRICTED_CHARACTERS = new ValidationErrorCodes(
    'FIRST_NAME_RESTRICTED_CHARACTERS',
    931,
    'This first name includes restricted characters.'
  );
  static readonly LAST_NAME_RESTRICTED_CHARACTERS = new ValidationErrorCodes(
    'LAST_NAME_RESTRICTED_CHARACTERS',
    932,
    'This first name includes restricted characters.'
  );
  static readonly EMAIL_RESTRICTED_CHARACTERS = new ValidationErrorCodes(
    'EMAIL_RESTRICTED_CHARACTERS',
    933,
    'This email includes restricted characters.'
  );
  static readonly USERNAME_RESTRICTED_CHARACTERS = new ValidationErrorCodes(
    'USERNAME_RESTRICTED_CHARACTERS',
    934,
    'This username includes restricted characters.'
  );
  static readonly TEL_NUM_RESTRICTED_CHARACTERS = new ValidationErrorCodes(
    'TEL_NUM_RESTRICTED_CHARACTERS',
    935,
    'This mobile phone number includes restricted characters.'
  );
  static readonly PASSWORD_RESTRICTED_CHARACTERS = new ValidationErrorCodes(
    'PASSWORD_RESTRICTED_CHARACTERS',
    936,
    'This password includes restricted characters.'
  );

  static readonly OLD_EMAIL_DOES_NOT_MATCH = new ValidationErrorCodes(
    'OLD_EMAIL_DOES_NOT_MATCH',
    940,
    "This email doesn't match with your previous one."
  );
  static readonly OLD_USERNAME_DOES_NOT_MATCH = new ValidationErrorCodes(
    'OLD_USERNAME_DOES_NOT_MATCH',
    941,
    "This username doesn't match with your previous one."
  );
  static readonly OLD_TEL_NUM_DOES_NOT_MATCH = new ValidationErrorCodes(
    'OLD_TEL_NUM_DOES_NOT_MATCH',
    942,
    "This mobile phone number doesn't match with your previous one."
  );
  static readonly OLD_PASSWORD_DOES_NOT_MATCH = new ValidationErrorCodes(
    'OLD_PASSWORD_DOES_NOT_MATCH',
    943,
    "This password doesn't match with your previous one."
  );
  static readonly PASSWORDS_DOES_NOT_MATCH = new ValidationErrorCodes(
    'PASSWORDS_DOES_NOT_MATCH',
    944,
    "The password doesn't match with password verification."
  );

  static readonly EMAIL_ALREADY_EXISTS = new ValidationErrorCodes(
    'EMAIL_ALREADY_EXISTS',
    950,
    'An account with the following email has already been signed up.'
  );
  static readonly USERNAME_ALREADY_EXISTS = new ValidationErrorCodes(
    'USERNAME_ALREADY_EXISTS',
    951,
    'An account with the following username has already been signed up.'
  );
  static readonly TEL_NUM_ALREADY_EXISTS = new ValidationErrorCodes(
    'TEL_NUM_ALREADY_EXISTS',
    952,
    'An account with the following email has already been signed up.'
  );

  private constructor(private readonly key: string, public readonly code: number, public readonly value: string) {}

  toString() {
    return this.key;
  }
}
