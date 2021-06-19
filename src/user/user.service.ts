import { ConflictException, forwardRef, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import { Model } from 'mongoose';
import crypto from 'crypto';
import argon2 from 'argon2';
import { v4 } from 'uuid';
import { User } from './interfaces/user.interface';
import { SignUpDto } from './dto/sign-up.dto';
import { Vault } from './interfaces/vault.interface';
import { LoginByEmailDto, LoginByUsernameDto } from './dto/login.dto';
import { VerifyUuidDto } from './dto/verify-uuid.dto';
import { ForgotPassword } from './interfaces/forgot-password.interface';
import { UserChangeEmailDto } from './dto/update-email.dto';
import { RequestBodyException } from '../exceptions/RequestBody.exception';
import { AuthService } from '../auth/services/auth.service';
import { JWTToken } from '../auth/services/interfaces/jwt-token.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GlobalErrorCodes } from '../exceptions/errorCodes/GlobalErrorCodes';
import { ValidationErrorCodes } from '../exceptions/errorCodes/ValidationErrorCodes';
import { UserChangePasswordDto } from './dto/update-password.dto';
import { InternalException } from '../exceptions/Internal.exception';
import { AddOrUpdateOptionalDataDto } from './dto/add-or-update-optional-data.dto';

const ms = require('ms');

@Injectable()
export class UserService {
  private HOURS_TO_VERIFY = 4;
  private HOURS_TO_BLOCK = 6;
  private LOGIN_ATTEMPTS_TO_BLOCK = 5;

  constructor(
    @InjectModel('User')
    private readonly userModel: Model<User>,
    @InjectModel('Vault')
    private readonly vaultModel: Model<Vault>,
    @InjectModel('ForgotPassword')
    private readonly forgotPasswordModel: Model<ForgotPassword>,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService
  ) {}

  async register(req: Request, userSignUpDto: SignUpDto): Promise<HttpStatus> {
    try {
      if (userSignUpDto.password === userSignUpDto.passwordVerification) {
        delete userSignUpDto.passwordVerification;
        userSignUpDto.userId = crypto.randomBytes(10).toString('hex');

        const salt = crypto.randomBytes(10).toString('hex');
        userSignUpDto.password = await this._generatePassword(userSignUpDto.password, salt);

        const user = new this.userModel(userSignUpDto);
        const vault = new this.vaultModel({ userId: userSignUpDto.userId, salt });
        user.userId = crypto.randomBytes(10).toString('hex');
        user.isActive = false;
        user.firstName = '';
        user.lastName = '';
        user.birthday = new Date().toLocaleDateString();
        user.phoneNumber = '';
        user.verification = v4();
        user.verificationExpires = Date.now() + ms(this.HOURS_TO_VERIFY);
        user.loginAttempts = 0;
        user.isBlocked = false;
        user.blockExpires = 0;
        await user.save();
        await vault.save();
        return HttpStatus.OK;
      }
    } catch (e) {
      if (e instanceof InternalException) {
        throw new InternalException({
          key: 'INTERNAL_ERROR',
          code: GlobalErrorCodes.INTERNAL_ERROR.code,
          message: GlobalErrorCodes.INTERNAL_ERROR.value
        });
      }
    }
  }

  async login(req: Request, loginUserDto: LoginByEmailDto & LoginByUsernameDto): Promise<JWTToken | void> {
    try {
      let user;

      const sessionData = {
        ip: req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        fingerprint: req.headers['fingerprint'].toString(),
        expiresIn: Date.now() + ms('20m'),
        createdAt: Date.now()
      };

      if (loginUserDto.username) {
        user = await this.userModel.findOne({ username: loginUserDto.username, verified: true });
        if (!user) {
          throw new RequestBodyException({
            key: 'INVALID_USERNAME',
            code: ValidationErrorCodes.INVALID_USERNAME.code,
            message: ValidationErrorCodes.INVALID_USERNAME.value
          });
        }
      } else if (loginUserDto.email) {
        user = await this.userModel.findOne({ email: loginUserDto.email, verified: true });
        if (!user) {
          throw new RequestBodyException({
            key: 'INVALID_EMAIL',
            code: ValidationErrorCodes.INVALID_EMAIL.code,
            message: ValidationErrorCodes.INVALID_EMAIL.value
          });
        }
      }

      if (user.blockExpires > Date.now()) {
        throw new ConflictException('User has been blocked try later.');
      }

      if (!(await argon2.verify(user.password, loginUserDto.password))) {
        user.loginAttempts += 1;
        await user.save();
        if (user.loginAttempts >= this.LOGIN_ATTEMPTS_TO_BLOCK) {
          user.blockExpires = new Date(Date.now() + ms(this.HOURS_TO_BLOCK));
          await user.save();
          throw new ConflictException('User blocked.');
        }
        throw new NotFoundException('Wrong email or password.');
      }

      user.loginAttempts = 0;
      await user.save();

      this.authService.generateJWT(user.userId, sessionData).then((tokens) => {
        const { accessToken, refreshToken } = tokens;
        return {
          accessToken,
          refreshToken
        };
      });
    } catch (e) {
      console.log(e.stack);
      if (e instanceof InternalException) {
        throw new InternalException({
          key: 'INTERNAL_ERROR',
          code: GlobalErrorCodes.INTERNAL_ERROR.code,
          message: GlobalErrorCodes.INTERNAL_ERROR.value
        });
      }
    }
  }

  async logout(req: Request): Promise<void> {
    try {
      await this.authService.logout(req);
    } catch (e) {
      if (e instanceof InternalException) {
        throw new InternalException({
          key: 'INTERNAL_ERROR',
          code: GlobalErrorCodes.INTERNAL_ERROR.code,
          message: GlobalErrorCodes.INTERNAL_ERROR.value
        });
      }
    }
  }

  async changeEmail(req: Request, changeEmailDto: UserChangeEmailDto) {
    try {
      await this.userModel.updateOne({ email: changeEmailDto.oldEmail }, { email: changeEmailDto.newEmail });
      return HttpStatus.OK;
    } catch (e) {
      if (e instanceof InternalException) {
        throw new InternalException({
          key: 'INTERNAL_ERROR',
          code: GlobalErrorCodes.INTERNAL_ERROR.code,
          message: GlobalErrorCodes.INTERNAL_ERROR.value
        });
      }
    }
  }

  async changePassword(req: Request, userChangePasswordDto: UserChangePasswordDto) {
    const userId = req.user.userId;

    try {
      const salt = crypto.randomBytes(10).toString('hex');
      userChangePasswordDto.newPassword = await this._generatePassword(userChangePasswordDto.newPassword, salt);
      await this.userModel.updateOne({ userId }, { password: userChangePasswordDto.newPassword });
      await this.vaultModel.updateOne({ userId }, { salt });
    } catch (e) {
      if (e instanceof InternalException) {
        throw new InternalException({
          key: 'INTERNAL_ERROR',
          code: GlobalErrorCodes.INTERNAL_ERROR.code,
          message: GlobalErrorCodes.INTERNAL_ERROR.value
        });
      }
    }
  }

  async addOrChangeOptionalData(req: Request, addOrUpdateOptionalDataDto: AddOrUpdateOptionalDataDto) {
    const userId = req.user.userId;

    try {
      await this.userModel.updateOne(
        { userId },
        {
          firstName: addOrUpdateOptionalDataDto.firstName ? addOrUpdateOptionalDataDto.firstName : '',
          lastName: addOrUpdateOptionalDataDto.lastName ? addOrUpdateOptionalDataDto.lastName : '',
          birthday: addOrUpdateOptionalDataDto.birthday ? addOrUpdateOptionalDataDto.birthday : '',
          phoneNumber: addOrUpdateOptionalDataDto.phoneNumber ? addOrUpdateOptionalDataDto.phoneNumber : ''
        }
      );
    } catch (e) {
      if (e instanceof InternalException) {
        throw new InternalException({
          key: 'INTERNAL_ERROR',
          code: GlobalErrorCodes.INTERNAL_ERROR.code,
          message: GlobalErrorCodes.INTERNAL_ERROR.value
        });
      }
    }
  }

  async refreshSession(req: Request) {
    try {
      this.authService.refreshSession(req).then((tokens) => {
        const { accessToken, refreshToken } = tokens;
        return {
          accessToken,
          refreshToken
        };
      });
    } catch (e) {
      if (e instanceof InternalException) {
        throw new InternalException({
          key: 'INTERNAL_ERROR',
          code: GlobalErrorCodes.INTERNAL_ERROR.code,
          message: GlobalErrorCodes.INTERNAL_ERROR.value
        });
      }
    }
  }

  async forgotPassword(req: Request, forgotPasswordDto: ForgotPasswordDto) {
    const userExists = await this.userModel.exists({ email: forgotPasswordDto.email, verified: true });
    try {
      if (userExists) {
        const forgotPassword = await this.forgotPasswordModel.create({
          email: forgotPasswordDto.email,
          verification: v4(),
          expires: Date.now() + ms(this.HOURS_TO_VERIFY),
          ipOfRequest: req.socket.remoteAddress,
          browserOfRequest: req.headers['user-agent'].toString() || 'XX',
          countryOfRequest: req.headers['country'].toString() || 'XX'
        });
        await forgotPassword.save();
        // someMethodToVerifyPasswordRefresh(forgotPasswordDto.email, forgotPassword.verification);
        return HttpStatus.OK;
      }
    } catch (e) {
      if (e instanceof InternalException) {
        throw new InternalException({
          key: 'INTERNAL_ERROR',
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

        const salt = crypto.randomBytes(10).toString('hex');
        const newPassword = await this._generatePassword(verifyUuidDto.newPassword, salt);
        await this.userModel.updateOne({ userId }, { password: newPassword });
        await this.vaultModel.updateOne({ userId }, { salt });
      } else {
        throw new RequestBodyException({
          key: 'PASSWORDS_DOES_NOT_MATCH',
          code: ValidationErrorCodes.PASSWORDS_DOES_NOT_MATCH.code,
          message: ValidationErrorCodes.PASSWORDS_DOES_NOT_MATCH.value
        });
      }
    } else {
      return HttpStatus.BAD_REQUEST;
    }

    return HttpStatus.OK;
  }

  async findById(userId) {
    return this.userModel.findOne({ userId });
  }

  async findByEmail(email) {
    return this.userModel.findOne({ email });
  }

  async isExistingByEmail(email) {
    return this.userModel.exists({ email });
  }

  async isExistingByUsername(username) {
    return this.userModel.exists({ username });
  }

  async isExistingByPassword(password) {
    return this.userModel.exists({ password });
  }

  async isExistingByTelNum(telNum) {
    return this.userModel.exists({ telNum });
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
