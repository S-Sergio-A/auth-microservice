import { forwardRef, Inject, Injectable } from '@nestjs/common';
import validator from 'validator';
import argon2 from 'argon2';
import crypto from 'crypto';
import { ValidationErrorCodes } from '../../exceptions/errorCodes/ValidationErrorCodes';
import { GlobalErrorCodes } from '../../exceptions/errorCodes/GlobalErrorCodes';
import { UserService } from '../../user/user.service';
import { SignUpDto } from '../../user/dto/sign-up.dto';
import { AddUpdateOptionalData } from '../interfaces/add-update-optional-data.interface';
import { UserLoginEmail, UserLoginUsername } from '../interfaces/user-log-in.interface';
import { EmailSubscription } from '../interfaces/email-subscription.interface';
import { InternalFailure } from '../interfaces/internal-failure.interface';
import { PasswordChange } from '../interfaces/password-change.interface';
import { EmailChange } from '../interfaces/email-change.interface';
import { ContactForm } from '../interfaces/contact-form.interface';
import { UserSignUp } from '../interfaces/user-sign-up.interface';
import { Subjects } from '../enums/contact-subjects.enum';
import { RulesEnum } from '../enums/rules.enum';

@Injectable()
export class ValidationService {
  private MAXIMUM_PASSWORD_VALIDATIONS = 5;
  private counter = 0;

  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
  ) {}

  async validateRegistration(data: SignUpDto) {
    let errors: Partial<UserSignUp & InternalFailure> = {};

    try {
      if (await this._isEmpty(data.email)) {
        errors.email = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (!validator.isEmail(data.email)) {
        errors.email = ValidationErrorCodes.INVALID_CREATE_EMAIL.value;
      } else if (!(await this._validateEmailLength(data.email))) {
        errors.email = ValidationErrorCodes.INVALID_CREATE_EMAIL_LENGTH.value;
      } else if (await this._isExistingEmail(data.email)) {
        errors.email = ValidationErrorCodes.EMAIL_ALREADY_EXISTS.value;
      }

      if (await this._isEmpty(data.username)) {
        errors.username = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (
        !validator.isLength(data.username, {
          min: Number.parseInt(RulesEnum.USERNAME_MIN_LENGTH),
          max: Number.parseInt(RulesEnum.USERNAME_MAX_LENGTH)
        })
      ) {
        errors.username = ValidationErrorCodes.INVALID_CREATE_USERNAME_LENGTH.value;
      } else if (await this._isExistingUsername(data.username)) {
        errors.username = ValidationErrorCodes.USERNAME_ALREADY_EXISTS.value;
      }

      if (await this._isEmpty(data.password)) {
        errors.password = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (
        !validator.isLength(data.password, {
          min: Number.parseInt(RulesEnum.PASSWORD_MIN_LENGTH),
          max: Number.parseInt(RulesEnum.PASSWORD_MAX_LENGTH)
        })
      ) {
        errors.password = ValidationErrorCodes.INVALID_CREATE_PASSWORD_LENGTH.value;
      } else if (!validator.isStrongPassword(data.password)) {
        errors.password = ValidationErrorCodes.INVALID_CREATE_PASSWORD.value;
      } else if (await this._isContainingOnlyWhitelistSymbols(data.password)) {
        errors.password = ValidationErrorCodes.PASSWORD_RESTRICTED_CHARACTERS.value;
      } else if (!(await this._validatePasswordUniqueness(data.password))) {
        errors.password = ValidationErrorCodes.INVALID_PASSWORD.value;
      }

      if (await this._isEmpty(data.passwordVerification)) {
        errors.passwordVerification = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (!validator.equals(data.password, data.passwordVerification)) {
        errors.passwordVerification = ValidationErrorCodes.PASSWORDS_DOES_NOT_MATCH.value;
      }
    } catch (err) {
      errors.internalFailure = err;
    }

    return {
      errors,
      isValid: await this._isEmpty(errors)
    };
  }

  async validateLogin(data) {
    let errors: Partial<(UserLoginEmail & UserLoginUsername) & InternalFailure> = {};
    const user = await this.userService.findByEmail(data.email);

    try {
      if (data.hasOwnProperty('email')) {
        if (await this._isEmpty(data.email)) {
          errors.email = GlobalErrorCodes.EMPTY_ERROR.value;
        } else if (!(await this._isExistingEmail(data.email))) {
          errors.email = ValidationErrorCodes.INVALID_EMAIL.value;
        }
      } else if (data.hasOwnProperty('username')) {
        if (await this._isEmpty(data.username)) {
          errors.username = GlobalErrorCodes.EMPTY_ERROR.value;
        } else if (!(await this._isExistingUsername(data.username))) {
          errors.username = ValidationErrorCodes.INVALID_USERNAME.value;
        }
      }

      if (await this._isEmpty(data.password)) {
        errors.password = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (!(await argon2.verify(user.password, data.password))) {
        errors.password = ValidationErrorCodes.INVALID_PASSWORD.value;
      }
    } catch (err) {
      errors.internalFailure = err;
    }

    console.log(errors);

    return {
      errors,
      isValid: await this._isEmpty(errors)
    };
  }

  async validateContactForm(data) {
    let errors: Partial<ContactForm & InternalFailure> = {};

    try {
      if (await this._isEmpty(data.firstName)) {
        errors.firstName = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (!(await this._isNameOrSurname(data.firstName))) {
        errors.firstName = ValidationErrorCodes.INVALID_CREATE_FIRST_NAME.value;
      }

      if (await this._isEmpty(data.lastName)) {
        errors.lastName = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (!(await this._isNameOrSurname(data.lastName))) {
        errors.lastName = ValidationErrorCodes.INVALID_CREATE_LAST_NAME.value;
      }

      if (await this._isEmpty(data.email)) {
        errors.email = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (!validator.isEmail(data.email)) {
        errors.email = ValidationErrorCodes.INVALID_CREATE_EMAIL.value;
      } else if (!(await this._validateEmailLength(data.email))) {
        errors.email = ValidationErrorCodes.INVALID_CREATE_EMAIL_LENGTH.value;
      }

      if (await this._isEmpty(data.subject)) {
        errors.subject = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (!(data.subject in Subjects)) {
        errors.subject = ValidationErrorCodes.INVALID_SUBJECT.value;
      }

      if (await this._isEmpty(data.message)) {
        errors.message = GlobalErrorCodes.EMPTY_ERROR.value;
      }
    } catch (err) {
      errors.internalFailure = err;
    }

    console.log(errors);

    return {
      errors,
      isValid: await this._isEmpty(errors)
    };
  }

  async validateEmailChange(data) {
    let errors: Partial<EmailChange & InternalFailure> = {};

    const emailMatches = await this.userService.isExistingByEmail(data.oldEmail);

    try {
      if (await this._isEmpty(data.oldEmail)) {
        errors.oldEmail = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (!emailMatches) {
        errors.oldEmail = ValidationErrorCodes.OLD_EMAIL_DOES_NOT_MATCH.value;
      }

      if (await this._isEmpty(data.newEmail)) {
        errors.newEmail = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (!validator.isEmail(data.newEmail)) {
        errors.newEmail = ValidationErrorCodes.INVALID_CREATE_EMAIL.value;
      } else if (!(await this._validateEmailLength(data.newEmail))) {
        errors.newEmail = ValidationErrorCodes.INVALID_CREATE_EMAIL_LENGTH.value;
      } else if (await this._isExistingEmail(data.newEmail)) {
        errors.newEmail = ValidationErrorCodes.EMAIL_ALREADY_EXISTS.value;
      }
    } catch (err) {
      errors.internalFailure = err;
    }

    console.log(errors);

    return {
      errors,
      isValid: await this._isEmpty(errors)
    };
  }

  // Шляпа TODO findOne - select only 1 needed field
  async validatePasswordChange(data) {
    let errors: Partial<PasswordChange & InternalFailure> = {};

    const user = await this.userService.findById(data.userId);

    try {
      if (await this._isEmpty(data.oldPassword)) {
        errors.oldPassword = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (!(await argon2.verify(user.password, data.oldPassword))) {
        errors.oldPassword = ValidationErrorCodes.OLD_PASSWORD_DOES_NOT_MATCH.value;
      }

      if (await this._isEmpty(data.newPassword)) {
        errors.newPassword = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (
        !validator.isLength(data.newPassword, {
          min: Number.parseInt(RulesEnum.PASSWORD_MIN_LENGTH),
          max: Number.parseInt(RulesEnum.PASSWORD_MAX_LENGTH)
        })
      ) {
        errors.newPassword = ValidationErrorCodes.INVALID_CREATE_PASSWORD_LENGTH.value;
      } else if (!validator.isStrongPassword(data.newPassword)) {
        errors.newPassword = ValidationErrorCodes.INVALID_CREATE_PASSWORD.value;
      } else if (await this._isContainingOnlyWhitelistSymbols(data.newPassword)) {
        errors.newPassword = ValidationErrorCodes.PASSWORD_RESTRICTED_CHARACTERS.value;
      } else if (!(await this._validatePasswordUniqueness(data.newPassword))) {
        errors.newPassword = ValidationErrorCodes.INVALID_PASSWORD.value;
      }
    } catch (err) {
      errors.internalFailure = err;
    }

    console.log(errors);

    return {
      errors,
      isValid: await this._isEmpty(errors)
    };
  }

  async validateOptionalDataChange(data) {
    let errors: Partial<AddUpdateOptionalData & InternalFailure> = {};

    try {
      if (data.hasOwnProperty('firstName')) {
        if (await this._isEmpty(data.firstName)) {
          errors.firstName = GlobalErrorCodes.EMPTY_ERROR.value;
        } else if (!(await this._isNameOrSurname(data.firstName))) {
          errors.firstName = ValidationErrorCodes.INVALID_CREATE_FIRST_NAME.value;
        }
      } else if (data.hasOwnProperty('lastName')) {
        if (await this._isEmpty(data.lastName)) {
          errors.lastName = GlobalErrorCodes.EMPTY_ERROR.value;
        } else if (!(await this._isNameOrSurname(data.lastName))) {
          errors.lastName = ValidationErrorCodes.INVALID_CREATE_LAST_NAME.value;
        }
      } else if (data.hasOwnProperty('birthday')) {
        if (await this._isEmpty(data.birthday)) {
          errors.birthday = GlobalErrorCodes.EMPTY_ERROR.value;
        } else if (!validator.isDate(data.birthday)) {
          errors.birthday = ValidationErrorCodes.INVALID_CREATE_BIRTHDAY.value;
        }
      } else if (data.hasOwnProperty('phoneNumber')) {
        if (await this._isEmpty(data.phoneNumber)) {
          errors.phoneNumber = GlobalErrorCodes.EMPTY_ERROR.value;
        } else if (await this._isExistingTelNum(data.phoneNumber)) {
          errors.phoneNumber = ValidationErrorCodes.OLD_TEL_NUM_DOES_NOT_MATCH.value;
        } else if (
          !validator.isLength(data.phoneNumber, {
            min: Number.parseInt(RulesEnum.TEL_NUM_MIN_LENGTH),
            max: Number.parseInt(RulesEnum.TEL_NUM_MAX_LENGTH)
          })
        ) {
          errors.phoneNumber = ValidationErrorCodes.INVALID_CREATE_TEL_NUM_LENGTH.value;
        } else if (
          data.phoneNumber.includes('+38') &&
          !validator.isMobilePhone(data.phoneNumber.replace(/\s/g, '').replace(/-/g, ''), 'uk-UA')
        ) {
          errors.phoneNumber = ValidationErrorCodes.INVALID_CREATE_TEL_NUM.value;
        } else if (
          (data.phoneNumber.includes('+7') || data.phoneNumber.includes('+8')) &&
          !validator.isMobilePhone(data.phoneNumber.replace(/\s/g, '').replace(/-/g, ''), 'ru-RU')
        ) {
          errors.phoneNumber = ValidationErrorCodes.INVALID_CREATE_TEL_NUM.value;
        } else if (
          data.phoneNumber.includes('+1') &&
          !validator.isMobilePhone(data.phoneNumber.replace(/\s/g, '').replace(/-/g, ''), 'en-US')
        ) {
          errors.phoneNumber = ValidationErrorCodes.INVALID_CREATE_TEL_NUM.value;
        }
      }
    } catch (err) {
      errors.internalFailure = err;
    }

    console.log(errors);

    return {
      errors,
      isValid: await this._isEmpty(errors)
    };
  }

  async validateEmail(email) {
    let errors: Partial<EmailSubscription & InternalFailure> = {};

    try {
      if (await this._isEmpty(email)) {
        errors.email = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (await this._isExistingEmail(email)) {
        errors.email = ValidationErrorCodes.EMAIL_ALREADY_EXISTS.value;
      } else if (!validator.isEmail(email)) {
        errors.email = ValidationErrorCodes.INVALID_CREATE_EMAIL.value;
      } else if (!(await this._validateEmailLength(email))) {
        errors.email = ValidationErrorCodes.INVALID_CREATE_EMAIL_LENGTH.value;
      }
    } catch (err) {
      errors.internalFailure = err;
    }

    console.log(errors);

    return {
      errors,
      isValid: await this._isEmpty(errors)
    };
  }

  private async _isNameOrSurname(str) {
    return !!str.match(new RegExp(RulesEnum.FIRST_AND_LAST_NAME_WHITELIST_SYMBOLS));
  }

  private async _isWord(str) {
    return !!str.match(new RegExp(RulesEnum.WORD_VALIDATION));
  }

  private async _validateEmailLength(email) {
    let splits = email.split('@');
    if (splits[0] && splits[1]) {
      return (
        splits[0].length < Number.parseInt(RulesEnum.EMAIL_LOCAL_PART_MAX_LENGTH) + 1 &&
        splits[0].length > Number.parseInt(RulesEnum.EMAIL_LOCAL_OR_DOMAIN_PART_MIN_LENGTH) - 1 &&
        splits[1].length < Number.parseInt(RulesEnum.EMAIL_DOMAIN_PART_MAX_LENGTH) + 1 &&
        splits[0].length > Number.parseInt(RulesEnum.EMAIL_LOCAL_OR_DOMAIN_PART_MIN_LENGTH) - 1
      );
    } else {
      return false;
    }
  }

  private async _isContainingOnlyWhitelistSymbols(str) {
    return !!str.match(new RegExp(RulesEnum.PASSWORD_WHITELIST_SYMBOLS));
  }

  private async _isExistingEmail(email) {
    try {
      return await this.userService.isExistingByEmail(email);
    } catch (e) {
      console.log('Querying failure in _isExistingEmail()' + e.stack);
      return { success: false, message: { errors: 500 } };
    }
  }

  private async _isExistingUsername(username) {
    try {
      return await this.userService.isExistingByUsername(username);
    } catch (e) {
      console.log('Querying failure in _isExistingUsername()' + e.stack);
      return { success: false, message: { errors: 500 } };
    }
  }

  private async _isExistingPassword(password) {
    try {
      return await this.userService.isExistingByPassword(password);
    } catch (e) {
      console.log('Querying failure in _isExistingPassword()' + e.stack);
      return { success: false, message: { errors: 500 } };
    }
  }

  private async _isExistingTelNum(telNum) {
    try {
      return await this.userService.isExistingByTelNum(telNum);
    } catch (e) {
      console.log('Querying failure in _isExistingTelNum()' + e.stack);
      return { success: false, message: { errors: 500 } };
    }
  }

  private async _isEmpty(obj) {
    if (obj !== undefined && obj !== null) {
      let isString = typeof obj === 'string' || obj instanceof String;
      if ((typeof obj === 'number' || obj instanceof Number) && obj !== 0) {
        return false;
      }
      return (
        obj === '' ||
        obj === 0 ||
        (Object.keys(obj).length === 0 && obj.constructor === Object) ||
        obj.length === 0 ||
        (isString && obj.trim().length === 0)
      );
    } else {
      return 'type is undefined or null';
    }
  }

  private async _validatePasswordUniqueness(password) {
    const salt = crypto.randomBytes(10).toString('hex');
    const saltedPassword = await this._generatePassword(password, salt);

    if (this.counter <= this.MAXIMUM_PASSWORD_VALIDATIONS) {
      if (await this._isExistingPassword(saltedPassword)) {
        await this._validatePasswordUniqueness(password);
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  private async _generatePassword(password, salt) {
    password = salt + password;

    return await argon2.hash(password, {
      hashLength: 40,
      memoryCost: 81920,
      timeCost: 4,
      type: argon2.argon2id
    });
  }
}
