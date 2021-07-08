import { Injectable } from "@nestjs/common";
import validator from "validator";
import { ValidationErrorCodes } from "../exceptions/errorCodes/ValidationErrorCodes";
import { GlobalErrorCodes } from "../exceptions/errorCodes/GlobalErrorCodes";
import { AddUpdateOptionalData } from "./interfaces/add-update-optional-data.interface";
import { UserLoginEmail, UserLoginPhoneNumber, UserLoginUsername } from "./interfaces/user-log-in.interface";
import { EmailSubscription } from "./interfaces/email-subscription.interface";
import { InternalFailure } from "./interfaces/internal-failure.interface";
import { PasswordChange } from "./interfaces/password-change.interface";
import { EmailChange } from "./interfaces/email-change.interface";
import { ContactForm } from "./interfaces/contact-form.interface";
import { PhoneChange } from "./interfaces/phone-change.interface";
import { UserSignUp } from "./interfaces/user-sign-up.interface";
import { Subjects } from "./enums/contact-subjects.enum";
import { RulesEnum } from "./enums/rules.enum";

@Injectable()
export class ValidationService {
  async validateRegistration(data) {
    let errors: Partial<UserSignUp & InternalFailure> = {};

    try {
      if (await this._isEmpty(data.email)) {
        errors.email = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (!validator.isEmail(data.email)) {
        errors.email = ValidationErrorCodes.INVALID_CREATE_EMAIL.value;
      } else if (!(await this._validateEmailLength(data.email))) {
        errors.email = ValidationErrorCodes.INVALID_CREATE_EMAIL_LENGTH.value;
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
      }

      if (await this._isEmpty(data.passwordVerification)) {
        errors.passwordVerification = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (!validator.equals(data.password, data.passwordVerification)) {
        errors.passwordVerification = ValidationErrorCodes.PASSWORDS_DOES_NOT_MATCH.value;
      }

      if (await this._isEmpty(data.phoneNumber)) {
        errors.phoneNumber = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (
        !validator.isLength(data.phoneNumber, {
          min: Number.parseInt(RulesEnum.TEL_NUM_MIN_LENGTH),
          max: Number.parseInt(RulesEnum.TEL_NUM_MAX_LENGTH)
        })
      ) {
        errors.phoneNumber = ValidationErrorCodes.INVALID_CREATE_TEL_NUM_LENGTH.value;
      } else if (!validator.isMobilePhone(data.phoneNumber.replace(/\s/g, "").replace(/-/g, ""))) {
        errors.phoneNumber = ValidationErrorCodes.INVALID_CREATE_TEL_NUM.value;
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

  async validateLogin(data) {
    let errors: Partial<(UserLoginEmail & UserLoginUsername & UserLoginPhoneNumber) & InternalFailure> = {};

    try {
      if (data.hasOwnProperty("email")) {
        if (await this._isEmpty(data.email)) {
          errors.email = GlobalErrorCodes.EMPTY_ERROR.value;
        }
      } else if (data.hasOwnProperty("username")) {
        if (await this._isEmpty(data.username)) {
          errors.username = GlobalErrorCodes.EMPTY_ERROR.value;
        }
      } else if (data.hasOwnProperty("phoneNumber")) {
        if (await this._isEmpty(data.phoneNumber)) {
          errors.phoneNumber = GlobalErrorCodes.EMPTY_ERROR.value;
        }
      }

      if (await this._isEmpty(data.password)) {
        errors.password = GlobalErrorCodes.EMPTY_ERROR.value;
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

    try {
      if (await this._isEmpty(data.oldEmail)) {
        errors.oldEmail = GlobalErrorCodes.EMPTY_ERROR.value;
      }

      if (await this._isEmpty(data.newEmail)) {
        errors.newEmail = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (!validator.isEmail(data.newEmail)) {
        errors.newEmail = ValidationErrorCodes.INVALID_CREATE_EMAIL.value;
      } else if (!(await this._validateEmailLength(data.newEmail))) {
        errors.newEmail = ValidationErrorCodes.INVALID_CREATE_EMAIL_LENGTH.value;
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

  async validatePhoneNumberChange(data) {
    let errors: Partial<PhoneChange & InternalFailure> = {};

    try {
      if (await this._isEmpty(data.oldPhoneNumber)) {
        errors.oldPhoneNumber = GlobalErrorCodes.EMPTY_ERROR.value;
      }

      if (await this._isEmpty(data.newPhoneNumber)) {
        errors.newPhoneNumber = GlobalErrorCodes.EMPTY_ERROR.value;
      } else if (
        !validator.isLength(data.newPhoneNumber, {
          min: Number.parseInt(RulesEnum.TEL_NUM_MIN_LENGTH),
          max: Number.parseInt(RulesEnum.TEL_NUM_MAX_LENGTH)
        })
      ) {
        errors.newPhoneNumber = ValidationErrorCodes.INVALID_CREATE_TEL_NUM_LENGTH.value;
      } else if (!validator.isMobilePhone(data.newPhoneNumber.replace(/\s/g, "").replace(/-/g, ""))) {
        errors.newPhoneNumber = ValidationErrorCodes.INVALID_CREATE_TEL_NUM.value;
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

  async validatePasswordChange(data) {
    let errors: Partial<PasswordChange & InternalFailure> = {};

    try {
      if (await this._isEmpty(data.oldPassword)) {
        errors.oldPassword = GlobalErrorCodes.EMPTY_ERROR.value;
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
      if (data.hasOwnProperty("firstName")) {
        if (await this._isEmpty(data.firstName)) {
          errors.firstName = GlobalErrorCodes.EMPTY_ERROR.value;
        } else if (!(await this._isNameOrSurname(data.firstName))) {
          errors.firstName = ValidationErrorCodes.INVALID_CREATE_FIRST_NAME.value;
        }
      } else if (data.hasOwnProperty("lastName")) {
        if (await this._isEmpty(data.lastName)) {
          errors.lastName = GlobalErrorCodes.EMPTY_ERROR.value;
        } else if (!(await this._isNameOrSurname(data.lastName))) {
          errors.lastName = ValidationErrorCodes.INVALID_CREATE_LAST_NAME.value;
        }
      } else if (data.hasOwnProperty("birthday")) {
        if (await this._isEmpty(data.birthday)) {
          errors.birthday = GlobalErrorCodes.EMPTY_ERROR.value;
        } else if (!validator.isDate(data.birthday)) {
          errors.birthday = ValidationErrorCodes.INVALID_CREATE_BIRTHDAY.value;
        }
      }
    } catch (err) {
      console.log(err);
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

  private async _validateEmailLength(email) {
    let splits = email.split("@");
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

  private async _isEmpty(obj) {
    if (obj !== undefined && obj !== null) {
      let isString = typeof obj === "string" || obj instanceof String;
      if ((typeof obj === "number" || obj instanceof Number) && obj !== 0) {
        return false;
      }
      return (
        obj === "" ||
        obj === 0 ||
        (Object.keys(obj).length === 0 && obj.constructor === Object) ||
        obj.length === 0 ||
        (isString && obj.trim().length === 0)
      );
    } else {
      return "type is undefined or null";
    }
  }
}
