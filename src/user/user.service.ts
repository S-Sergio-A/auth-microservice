import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Request, Response } from "express";
import { Model } from "mongoose";
import crypto from "crypto";
import argon2 from "argon2";
import { v4 } from "uuid";
import { UserLoginEmailError, UserLoginPhoneNumberError, UserLoginUsernameError } from "../pipes/interfaces/user-log-in.interface";
import { ValidationErrorCodes } from "../exceptions/errorCodes/ValidationErrorCodes";
import { InternalFailure } from "../pipes/interfaces/internal-failure.interface";
import { PasswordChangeError } from "../pipes/interfaces/password-change.interface";
import { GlobalErrorCodes } from "../exceptions/errorCodes/GlobalErrorCodes";
import { RequestBodyException } from "../exceptions/RequestBody.exception";
import { ValidationException } from "../exceptions/Validation.exception";
import { EmailChangeError } from "../pipes/interfaces/email-change.interface";
import { UserErrorCodes } from "../exceptions/errorCodes/UserErrorCodes";
import { PhoneChangeError } from "../pipes/interfaces/phone-change.interface";
import { UserSignUpError } from "../pipes/interfaces/user-sign-up.interface";
import { InternalException } from "../exceptions/Internal.exception";
import { AuthService } from "../auth/services/auth.service";
import { LoginByEmailDto, LoginByPhoneNumberDto, LoginByUsernameDto } from "./dto/login.dto";
import { AddOrUpdateOptionalDataDto } from "./dto/add-or-update-optional-data.dto";
import { ForgotPasswordDocument } from "./schemas/forgot-password.schema";
import { UserChangePasswordDto } from "./dto/update-password.dto";
import { UserChangePhoneNumberDto } from "./dto/update-phone.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { UserChangeEmailDto } from "./dto/update-email.dto";
import { VaultDocument } from "./schemas/vault.schema";
import { VerifyUuidDto } from "./dto/verify-uuid.dto";
import { UserDocument } from "./schemas/user.schema";
import { SignUpDto } from "./dto/sign-up.dto";

const ms = require("ms");

@Injectable()
export class UserService {
  constructor(
    @InjectModel("User")
    private readonly userModel: Model<UserDocument>,
    @InjectModel("Vault")
    private readonly vaultModel: Model<VaultDocument>,
    @InjectModel("Forgot-Password")
    private readonly forgotPasswordModel: Model<ForgotPasswordDocument>,
    private readonly authService: AuthService
  ) {}

  private MAXIMUM_PASSWORD_VALIDATIONS = 5;
  private HOURS_TO_VERIFY = "4h";
  private HOURS_TO_BLOCK = "6h";
  private LOGIN_ATTEMPTS_TO_BLOCK = 5;
  private counter = 0;

  async register(userSignUpDto: SignUpDto): Promise<HttpStatus | ValidationException> {
    const errors: Partial<UserSignUpError> = {};

    try {
      if (await this._isExistingEmail(userSignUpDto.email)) {
        errors.email = ValidationErrorCodes.EMAIL_ALREADY_EXISTS.value;
      }
      if (await this._isExistingUsername(userSignUpDto.username)) {
        errors.username = ValidationErrorCodes.USERNAME_ALREADY_EXISTS.value;
      }
      if (!(await this._validatePasswordUniqueness(userSignUpDto.password))) {
        errors.password = ValidationErrorCodes.INVALID_PASSWORD.value;
      }
      if (await this._isExistingPhone(userSignUpDto.phoneNumber)) {
        errors.phoneNumber = ValidationErrorCodes.TEL_NUM_ALREADY_EXISTS.value;
      }
      if (!(await this._isEmpty(errors))) {
        throw new ValidationException(errors);
      }

      if (userSignUpDto.password === userSignUpDto.passwordVerification) {
        delete userSignUpDto.passwordVerification;
        const salt = crypto.randomBytes(10).toString("hex");
        userSignUpDto.password = await this._generatePassword(userSignUpDto.password, salt);

        const user = new this.userModel(userSignUpDto);

        user.id = v4();
        user.isActive = false;
        user.firstName = "";
        user.lastName = "";
        user.birthday = "";
        user.verification = v4();
        user.verificationExpires = Date.now() + ms(this.HOURS_TO_VERIFY);
        user.loginAttempts = 0;
        user.isBlocked = false;
        user.blockExpires = 0;

        const vault = new this.vaultModel({ userId: user.id, salt });

        if (!vault) {
          throw new InternalException({
            key: "INTERNAL_ERROR",
            code: GlobalErrorCodes.INTERNAL_ERROR.code,
            message: GlobalErrorCodes.INTERNAL_ERROR.value
          });
        }

        user.save((e) => {
          if (e) {
            console.log(e);
            return;
          }
        });
        await vault.save();
        return HttpStatus.OK;
      }
    } catch (e) {
      console.log(e.stack);
      if (e instanceof InternalException) {
        throw new InternalException({
          key: "INTERNAL_ERROR",
          code: GlobalErrorCodes.INTERNAL_ERROR.code,
          message: GlobalErrorCodes.INTERNAL_ERROR.value
        });
      }

      if (e instanceof ValidationException) {
        throw new ValidationException(errors);
      }
    }
  }

  async login(req: Request, res: Response, loginUserDto: LoginByEmailDto & LoginByUsernameDto & LoginByPhoneNumberDto) {
    let errors: Partial<(UserLoginEmailError & UserLoginUsernameError & UserLoginPhoneNumberError) & InternalFailure> = {};
    let user;

    try {
      const sessionData = {
        ip: req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
        fingerprint: req.headers["fingerprint"].toString(),
        expiresIn: Date.now() + ms("20m"),
        createdAt: Date.now()
      };

      if (loginUserDto.username) {
        user = await this.userModel.findOne({ username: loginUserDto.username });
        if (!user) {
          errors.username = ValidationErrorCodes.INVALID_USERNAME.value;
        }
      } else if (loginUserDto.phoneNumber) {
        user = await this.userModel.findOne({ phoneNumber: loginUserDto.phoneNumber });
        if (!user) {
          errors.username = ValidationErrorCodes.INVALID_TEL_NUM.value;
        }
      } else if (loginUserDto.email) {
        user = await this.userModel.findOne({ email: loginUserDto.email });
        if (!user) {
          errors.email = ValidationErrorCodes.INVALID_EMAIL.value;
        }
      }

      if (!!user) {
        if (!user.isActive) {
          errors.internalFailure = UserErrorCodes.NOT_ACTIVE.value;
        }

        if (user.isActive && user.blockExpires > Date.now() && user.isBlocked) {
          res
            .status(HttpStatus.CONFLICT)
            .json({
              errors: {
                message: "You have been blocked, try later."
              }
            })
            .end();
        }

        if (user.isActive && user.blockExpires !== 0 && user.blockExpires < Date.now()) {
          user.isBlocked = false;
          user.blockExpires = 0;
          user.save();
        }

        const userId = user.id;

        const { salt } = await this.vaultModel.findOne({ userId });

        if (!(await argon2.verify(user.password, salt + loginUserDto.password))) {
          user.loginAttempts += 1;
          await user.save();
          if (user.loginAttempts >= this.LOGIN_ATTEMPTS_TO_BLOCK) {
            user.blockExpires = new Date(Date.now() + ms(this.HOURS_TO_BLOCK));
            user.isBlocked = true;
            user.loginAttempts = 0;
            await user.save();
            res
              .status(HttpStatus.CONFLICT)
              .json({
                errors: {
                  message: `You are blocked for ${this.HOURS_TO_BLOCK.toUpperCase()}.`
                }
              })
              .end();
          }
          errors.password = ValidationErrorCodes.INVALID_PASSWORD.value;
        }

        if (!(await this._isEmpty(errors))) {
          throw new ValidationException(errors);
        }

        this.authService.generateJWT(user.id, sessionData).then((tokens) => {
          const { accessToken, refreshToken } = tokens;
          user.loginAttempts = 0;
          user.save();

          res
            .status(HttpStatus.OK)
            .json({
              accessToken,
              refreshToken
            })
            .end();
        });
      }
    } catch (e) {
      console.log(e.stack);
      if (e instanceof InternalException) {
        throw new InternalException({
          key: "INTERNAL_ERROR",
          code: GlobalErrorCodes.INTERNAL_ERROR.code,
          message: GlobalErrorCodes.INTERNAL_ERROR.value
        });
      }

      if (e instanceof ValidationException) {
        throw new ValidationException(errors);
      }
    }
  }

  async logout(req: Request): Promise<void> {
    try {
      await this.authService.logout(req);
    } catch (e) {
      if (e instanceof InternalException) {
        throw new InternalException({
          key: "INTERNAL_ERROR",
          code: GlobalErrorCodes.INTERNAL_ERROR.code,
          message: GlobalErrorCodes.INTERNAL_ERROR.value
        });
      }
    }
  }

  async changeEmail(req: Request, changeEmailDto: UserChangeEmailDto) {
    const errors: Partial<EmailChangeError> = {};

    try {
      const emailMatches = await this._isExistingEmail(changeEmailDto.oldEmail);

      if (!emailMatches) {
        errors.oldEmail = ValidationErrorCodes.OLD_EMAIL_DOES_NOT_MATCH.value;
      }
      if (await this._isExistingEmail(changeEmailDto.newEmail)) {
        errors.newEmail = ValidationErrorCodes.EMAIL_ALREADY_EXISTS.value;
      }
      if (!(await this._isEmpty(errors))) {
        throw new ValidationException(errors);
      }

      await this.userModel.updateOne({ email: changeEmailDto.oldEmail }, { email: changeEmailDto.newEmail });
      return HttpStatus.OK;
    } catch (e) {
      if (e instanceof InternalException) {
        throw new InternalException({
          key: "INTERNAL_ERROR",
          code: GlobalErrorCodes.INTERNAL_ERROR.code,
          message: GlobalErrorCodes.INTERNAL_ERROR.value
        });
      }

      if (e instanceof ValidationException) {
        throw new ValidationException(errors);
      }
    }
  }

  async changePhoneNumber(req: Request, changePhoneNumberDto: UserChangePhoneNumberDto) {
    const errors: Partial<PhoneChangeError> = {};

    try {
      const phoneMatches = await this._isExistingPhone(changePhoneNumberDto.oldPhoneNumber);

      if (!phoneMatches) {
        errors.oldPhoneNumber = ValidationErrorCodes.OLD_TEL_NUM_DOES_NOT_MATCH.value;
      }
      if (await this._isExistingEmail(changePhoneNumberDto.newPhoneNumber)) {
        errors.newPhoneNumber = ValidationErrorCodes.TEL_NUM_ALREADY_EXISTS.value;
      }
      if (!(await this._isEmpty(errors))) {
        throw new ValidationException(errors);
      }

      await this.userModel.updateOne(
        { phoneNumber: changePhoneNumberDto.oldPhoneNumber },
        { phoneNumber: changePhoneNumberDto.newPhoneNumber }
      );
      return HttpStatus.OK;
    } catch (e) {
      if (e instanceof InternalException) {
        throw new InternalException({
          key: "INTERNAL_ERROR",
          code: GlobalErrorCodes.INTERNAL_ERROR.code,
          message: GlobalErrorCodes.INTERNAL_ERROR.value
        });
      }

      if (e instanceof ValidationException) {
        throw new ValidationException(errors);
      }
    }
  }

  async changePassword(req: Request, userChangePasswordDto: UserChangePasswordDto) {
    const userId = req.user.userId;
    const errors: Partial<PasswordChangeError> = {};

    try {
      const user = await this.userModel.findOne({ id: userId, isActive: true });
      const { salt: oldSalt } = await this.vaultModel.findOne({ userId });

      if (!(await argon2.verify(user.password, oldSalt + userChangePasswordDto.oldPassword))) {
        errors.oldPassword = ValidationErrorCodes.OLD_PASSWORD_DOES_NOT_MATCH.value;
      } else if (!(await this._validatePasswordUniqueness(userChangePasswordDto.newPassword))) {
        errors.newPassword = ValidationErrorCodes.INVALID_PASSWORD.value;
      }
      if (!(await this._isEmpty(errors))) {
        throw new ValidationException(errors);
      }

      const salt = crypto.randomBytes(10).toString("hex");
      userChangePasswordDto.newPassword = await this._generatePassword(userChangePasswordDto.newPassword, salt);
      await this.userModel.updateOne({ id: userId }, { password: userChangePasswordDto.newPassword });
      await this.vaultModel.updateOne({ userId }, { salt });
    } catch (e) {
      if (e instanceof InternalException) {
        throw new InternalException({
          key: "INTERNAL_ERROR",
          code: GlobalErrorCodes.INTERNAL_ERROR.code,
          message: GlobalErrorCodes.INTERNAL_ERROR.value
        });
      }

      if (e instanceof ValidationException) {
        throw new ValidationException(errors);
      }
    }
  }

  async addOrChangeOptionalData(req: Request, addOrUpdateOptionalDataDto: AddOrUpdateOptionalDataDto) {
    const userId = req.user.userId;

    try {
      const user = await this.userModel.findOne({ id: userId, isActive: true });

      await this.userModel.updateOne(
        { id: userId },
        {
          firstName: addOrUpdateOptionalDataDto.firstName ? addOrUpdateOptionalDataDto.firstName : user.firstName,
          lastName: addOrUpdateOptionalDataDto.lastName ? addOrUpdateOptionalDataDto.lastName : user.lastName,
          birthday: addOrUpdateOptionalDataDto.birthday ? addOrUpdateOptionalDataDto.birthday : user.birthday
        }
      );
    } catch (e) {
      if (e instanceof InternalException) {
        throw new InternalException({
          key: "INTERNAL_ERROR",
          code: GlobalErrorCodes.INTERNAL_ERROR.code,
          message: GlobalErrorCodes.INTERNAL_ERROR.value
        });
      }
    }
  }

  async refreshSession(req: Request, res: Response) {
    const sessionData = {
      ip: req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
      fingerprint: req.headers["fingerprint"].toString(),
      expiresIn: Date.now() + ms("20m"),
      createdAt: Date.now()
    };

    this.authService
      .refreshSession(req, sessionData)
      .then((tokens) => {
        const { accessToken, refreshToken } = tokens;

        res
          .status(HttpStatus.OK)
          .json({
            accessToken,
            refreshToken
          })
          .end();
      })
      .catch((e) => {
        res
          .status(HttpStatus.BAD_REQUEST)
          .json({
            errors: {
              message: e.response.message
            }
          })
          .end();
      });
  }

  async forgotPassword(req: Request, forgotPasswordDto: ForgotPasswordDto) {
    const userExists = await this.userModel.exists({ email: forgotPasswordDto.email, isActive: true });
    try {
      if (userExists) {
        const forgotPassword = await this.forgotPasswordModel.create({
          email: forgotPasswordDto.email,
          verification: v4(),
          expires: Date.now() + ms(this.HOURS_TO_VERIFY),
          ipOfRequest: req.socket.remoteAddress,
          browserOfRequest: req.headers["user-agent"].toString() || "XX",
          countryOfRequest: req.headers["country"].toString() || "XX"
        });
        await forgotPassword.save();
        // someMethodToVerifyPasswordRefresh(forgotPasswordDto.email, forgotPassword.verification);
        return HttpStatus.OK;
      }
    } catch (e) {
      if (e instanceof InternalException) {
        throw new InternalException({
          key: "INTERNAL_ERROR",
          code: GlobalErrorCodes.INTERNAL_ERROR.code,
          message: GlobalErrorCodes.INTERNAL_ERROR.value
        });
      }
    }
    return HttpStatus.BAD_REQUEST;
  }

  async forgotPasswordVerify(req: Request, verifyUuidDto: VerifyUuidDto) {
    const userId = req.user.userId;
    const forgotPassword = await this.forgotPasswordModel.exists({
      verification: verifyUuidDto.verification
    });

    if (forgotPassword) {
      if (verifyUuidDto.newPassword === verifyUuidDto.newPasswordVerification) {
        delete verifyUuidDto.newPasswordVerification;

        const salt = crypto.randomBytes(10).toString("hex");
        const newPassword = await this._generatePassword(verifyUuidDto.newPassword, salt);
        await this.userModel.updateOne({ userId }, { password: newPassword });
        await this.vaultModel.updateOne({ userId }, { salt });
      } else {
        throw new RequestBodyException({
          key: "PASSWORDS_DOES_NOT_MATCH",
          code: ValidationErrorCodes.PASSWORDS_DOES_NOT_MATCH.code,
          message: ValidationErrorCodes.PASSWORDS_DOES_NOT_MATCH.value
        });
      }
    } else {
      return HttpStatus.BAD_REQUEST;
    }

    return HttpStatus.OK;
  }

  async _findById(id) {
    return this.userModel.findOne({ id });
  }

  async _isExistingEmail(email) {
    return this.userModel.exists({ email });
  }

  async _isExistingUsername(username) {
    return this.userModel.exists({ username });
  }

  async _isExistingPhone(phoneNumber) {
    return this.userModel.exists({ phoneNumber });
  }

  async _isExistingPassword(password) {
    return this.userModel.exists({ password });
  }

  private async _validatePasswordUniqueness(password) {
    const salt = crypto.randomBytes(10).toString("hex");
    const saltedPassword = await this._generatePassword(password, salt);

    if (this.counter <= this.MAXIMUM_PASSWORD_VALIDATIONS) {
      if (await this._isExistingPassword(saltedPassword)) {
        await this._validatePasswordUniqueness(password);
      } else {
        this.counter = 0;
        return true;
      }
    } else {
      this.counter = 0;
      return false;
    }
  }

  private async _generatePassword(password, salt) {
    password = salt + password;

    return await argon2.hash(password, {
      hashLength: 40,
      memoryCost: 8192,
      timeCost: 4,
      type: argon2.argon2id
    });
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
