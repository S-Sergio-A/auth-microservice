import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import crypto from 'crypto';
import { Request } from 'express';
import { v4 } from 'uuid';
import argon2 from 'argon2';
import { User } from '../../interfaces/user.interface';
import { UserAddOrUpdateOptionalData, UserChangeEmail, UserChangePassword } from './interfaces/user-update.interface';
import { UserControllerInterface } from '../../controllers/interfaces/user.controller.interface';
import { SignUpDto } from '../../dto/sign-up.dto';
import { Vault } from '../../interfaces/vault.interface';
import { LoginByEmailDto, LoginByUsernameDto } from '../../dto/login.dto';
import { ResetPasswordDto } from '../../dto/reset-password.dto';
import { VerifyUuidDto } from '../../dto/verify-uuid.dto';
import { ForgotPassword } from '../../interfaces/forgot-password.interface';
import { UserChangeEmailDto } from '../../dto/update-email.dto';

@Injectable()
export class UserService implements UserControllerInterface {
  HOURS_TO_VERIFY = 4;
  HOURS_TO_BLOCK = 6;
  LOGIN_ATTEMPTS_TO_BLOCK = 5;

  constructor(
    @InjectModel('User')
    private readonly userModel: Model<User>,
    @InjectModel('Vault')
    private readonly vaultModel: Model<Vault>
  ) {}

  async register(req: Request, userSignUpDto: SignUpDto) {
    let data = req.body;

    if (!data) {
      console.log('Empty request body in UsersService.register()!');
      return { success: false, errors: { code: 10 } };
    }

    if (userSignUpDto.password === userSignUpDto.passwordVerification) {
      delete userSignUpDto.passwordVerification;
      userSignUpDto.userId = crypto.randomBytes(10).toString('hex');

      const salt = crypto.randomBytes(10).toString('hex');
      userSignUpDto.password = await this._generatePassword(data.password, salt);

      const user = new this.userModel(userSignUpDto);
      const vault = new this.vaultModel({ userId: userSignUpDto.userId, salt });
      await this.isEmailUnique(user.email);
      this.setRegistrationInfo(user);
      await user.save();
      await vault.save();
      return this.buildRegistrationInfo(user);
    }

    // if (validation.isValid) {
    //   const cartId = crypto.randomBytes(10).toString('hex');
    //
    //   try {
    //     await pool.query(sqlReg, [data.firstName, data.lastName, data.email, data.telNum, data.password, userId]);
    //     await pool.query(sqlVault, [userId, salt]);
    //     await pool.query(sqlCreateCart, [userId, Date.now(), cartId]);
    //     await validateEmail(data.email);
    //     return {success: true, code: null};
    //   } catch (e) {
    //     console.log('Querying failure in UsersService.register()\n\n' + e.stack);
    //     return {success: false, errors: {code: 500}};
    //   }
    // } else {
    //   console.log('Validation failure in UsersService.register()');
    //   return {
    //     success: false,
    //     errors: validation.errors
    //   };
    // }
  }

  async changeEmail(req:Request, changeEmailDto: UserChangeEmailDto) {
    const user = req.user;
    let data = req.body;
    const sqlEmail = 'SELECT email FROM users WHERE user_id = $1';
    const sqlMain = 'UPDATE users SET email = $1 WHERE user_id = $2 AND email = $3';
  
    if (!data) {
      console.log('Empty request body in UsersService.changeEmail()!');
      return {success: false, errors: {code: 10}};
    }
  
    const {rows} = await pool.query(sqlEmail, [user.userId]);
    const validation = await validator.default.validateEmailChange(data, rows[0].email);
    if (validation.isValid) {
      try {
        await pool.query(sqlMain, [data.newEmail, user.userId, data.oldEmail]);
        return {success: true, errors: null};
      } catch (e) {
        console.log('Email update failure in UsersService.changeEmail()  \n\n' + e.stack);
        return {success: false, errors: {code: 500}};
      }
    } else {
      console.log('Validation failure in UsersService.changeEmail()');
      return {
        success: false,
        errors: validation.errors
      };
    }
  }

  async changePassword(user: UserChangePassword) {
    const pool = db.pool;
    const user = req.user;
    const data = req.body;
    const sqlMain = 'UPDATE users SET password = $1 WHERE user_id = $2;';
    const sqlPassword = 'SELECT u.password, v.salt FROM vault v INNER JOIN users u on u.user_id = v.user_id WHERE v.user_id = $1;';
    const sqlVault = 'UPDATE vault SET salt = $1 WHERE user_id = $2';
  
    if (!data) {
      console.log('Empty request body in UsersService.changePassword()!');
      return {success: false, errors: {code: 10}};
    }
  
    const {rows} = await pool.query(sqlPassword, [user.userId]);
    let result = rows[0];
    data.oldPassword = result.salt + data.oldPassword;
    const validation = await validator.default.validatePasswordChange(data, result.password);
  
    if (validation.isValid) {
      const salt = crypto.randomBytes(10).toString('hex');
      data.newPassword = await _generatePassword(data.newPassword, salt);
      try {
        await pool.query(sqlMain, [data.newPassword, user.userId]);
        await pool.query(sqlVault, [salt, user.userId]);
        return {success: true, errors: null};
      } catch (e) {
        console.log('Vault update failure in UsersService.changePassword()  \n\n' + e.stack);
        return {success: false, errors: {code: 500}};
      }
    } else {
      console.log('Validation failure in UsersService.changePassword()');
      return {
        success: false,
        errors: validation.errors
      };
    }
  }

  async addOrChangeOptionalData(user: UserAddOrUpdateOptionalData) {
  
  
  }

  private async _verifyEmail(req: Request, verifyUuidDto: VerifyUuidDto) {
    const user = await this.findByVerification(verifyUuidDto.verification);
    await this.setUserAsVerified(user);
    return {
      fullName: user.fullName,
      email: user.email,
      accessToken: await this.authService.createAccessToken(user._id),
      refreshToken: await this.authService.createRefreshToken(req, user._id)
    };
  }

  // ┬  ┌─┐┌─┐┬┌┐┌
  // │  │ ││ ┬││││
  // ┴─┘└─┘└─┘┴┘└┘
  async login(req: Request, loginUserDto: LoginByEmailDto | LoginByUsernameDto) {
    const user = await this.findUserByEmail(loginUserDto.email);
    this.isUserBlocked(user);
    await this.checkPassword(loginUserDto.password, user);
    await this.passwordsAreMatch(user);
    return {
      fullName: user.fullName,
      email: user.email,
      accessToken: await this.authService.createAccessToken(user._id),
      refreshToken: await this.authService.createRefreshToken(req, user._id)
    };
  }

  // ┬─┐┌─┐┌─┐┬─┐┌─┐┌─┐┬ ┬  ┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐  ┌┬┐┌─┐┬┌─┌─┐┌┐┌
  // ├┬┘├┤ ├┤ ├┬┘├┤ └─┐├─┤  ├─┤│  │  ├┤ └─┐└─┐   │ │ │├┴┐├┤ │││
  // ┴└─└─┘└  ┴└─└─┘└─┘┴ ┴  ┴ ┴└─┘└─┘└─┘└─┘└─┘   ┴ └─┘┴ ┴└─┘┘└┘
  async refreshAccessToken(refreshAccessTokenDto: RefreshAccessTokenDto) {
    const userId = await this.authService.findRefreshToken(refreshAccessTokenDto.refreshToken);
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('Bad request');
    }
    return {
      accessToken: await this.authService.createAccessToken(user._id)
    };
  }

  // ┌─┐┌─┐┬─┐┌─┐┌─┐┌┬┐  ┌─┐┌─┐┌─┐┌─┐┬ ┬┌─┐┬─┐┌┬┐
  // ├┤ │ │├┬┘│ ┬│ │ │   ├─┘├─┤└─┐└─┐││││ │├┬┘ ││
  // └  └─┘┴└─└─┘└─┘ ┴   ┴  ┴ ┴└─┘└─┘└┴┘└─┘┴└──┴┘
  async forgotPassword(req: Request, createForgotPasswordDto: CreateForgotPasswordDto) {
    await this.findByEmail(createForgotPasswordDto.email);
    await this.saveForgotPassword(req, createForgotPasswordDto);
    return {
      email: createForgotPasswordDto.email,
      message: 'verification sent.'
    };
  }

  // ┌─┐┌─┐┬─┐┌─┐┌─┐┌┬┐  ┌─┐┌─┐┌─┐┌─┐┬ ┬┌─┐┬─┐┌┬┐  ┬  ┬┌─┐┬─┐┬┌─┐┬ ┬
  // ├┤ │ │├┬┘│ ┬│ │ │   ├─┘├─┤└─┐└─┐││││ │├┬┘ ││  └┐┌┘├┤ ├┬┘│├┤ └┬┘
  // └  └─┘┴└─└─┘└─┘ ┴   ┴  ┴ ┴└─┘└─┘└┴┘└─┘┴└──┴┘   └┘ └─┘┴└─┴└   ┴
  async forgotPasswordVerify(req: Request, verifyUuidDto: VerifyUuidDto) {
    const forgotPassword = await this.findForgotPasswordByUuid(verifyUuidDto);
    await this.setForgotPasswordFirstUsed(req, forgotPassword);
    return {
      email: forgotPassword.email,
      message: 'now reset your password.'
    };
  }

  // ┬─┐┌─┐┌─┐┌─┐┌┬┐  ┌─┐┌─┐┌─┐┌─┐┬ ┬┌─┐┬─┐┌┬┐
  // ├┬┘├┤ └─┐├┤  │   ├─┘├─┤└─┐└─┐││││ │├┬┘ ││
  // ┴└─└─┘└─┘└─┘ ┴   ┴  ┴ ┴└─┘└─┘└┴┘└─┘┴└──┴┘
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const forgotPassword = await this.findForgotPasswordByEmail(resetPasswordDto);
    // await this.setForgotPasswordFinalUsed(forgotPassword);
    await this.resetUserPassword(resetPasswordDto);
    return {
      email: resetPasswordDto.email,
      message: 'password successfully changed.'
    };
  }

  // ********************************************
  // ╔═╗╦═╗╦╦  ╦╔═╗╔╦╗╔═╗  ╔╦╗╔═╗╔╦╗╦ ╦╔═╗╔╦╗╔═╗
  // ╠═╝╠╦╝║╚╗╔╝╠═╣ ║ ║╣   ║║║║╣  ║ ╠═╣║ ║ ║║╚═╗
  // ╩  ╩╚═╩ ╚╝ ╩ ╩ ╩ ╚═╝  ╩ ╩╚═╝ ╩ ╩ ╩╚═╝═╩╝╚═╝
  // ********************************************

  private async isEmailUnique(email: string) {
    const user = await this.userModel.findOne({ email, verified: true });
    if (user) {
      throw new BadRequestException('Email most be unique.');
    }
  }

  private setRegistrationInfo(user): any {
    user.verification = v4();
    user.verificationExpires = addHours(new Date(), this.HOURS_TO_VERIFY);
  }

  private buildRegistrationInfo(user): any {
    const userRegistrationInfo = {
      fullName: user.fullName,
      email: user.email,
      verified: user.verified
    };
    return userRegistrationInfo;
  }

  private async findByVerification(verification: string): Promise<User> {
    const user = await this.userModel.findOne({
      verification,
      verified: false,
      verificationExpires: { $gt: new Date() }
    });
    if (!user) {
      throw new BadRequestException('Bad request.');
    }
    return user;
  }

  private async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email, verified: true });
    if (!user) {
      throw new NotFoundException('Email not found.');
    }
    return user;
  }

  private async setUserAsVerified(user) {
    user.verified = true;
    await user.save();
  }

  private async findUserByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email, verified: true });
    if (!user) {
      throw new NotFoundException('Wrong email or password.');
    }
    return user;
  }

  private async checkPassword(attemptPass: string, user) {
    const match = await bcrypt.compare(attemptPass, user.password);
    if (!match) {
      await this.passwordsDoNotMatch(user);
      throw new NotFoundException('Wrong email or password.');
    }
    return match;
  }

  private isUserBlocked(user) {
    if (user.blockExpires > Date.now()) {
      throw new ConflictException('User has been blocked try later.');
    }
  }

  private async passwordsDoNotMatch(user) {
    user.loginAttempts += 1;
    await user.save();
    if (user.loginAttempts >= this.LOGIN_ATTEMPTS_TO_BLOCK) {
      await this.blockUser(user);
      throw new ConflictException('User blocked.');
    }
  }

  private async blockUser(user) {
    user.blockExpires = addHours(new Date(), this.HOURS_TO_BLOCK);
    await user.save();
  }

  private async passwordsAreMatch(user) {
    user.loginAttempts = 0;
    await user.save();
  }

  private async saveForgotPassword(req: Request, createForgotPasswordDto: CreateForgotPasswordDto) {
    const forgotPassword = await this.forgotPasswordModel.create({
      email: createForgotPasswordDto.email,
      verification: v4(),
      expires: addHours(new Date(), this.HOURS_TO_VERIFY),
      ip: this.authService.getIp(req),
      browser: this.authService.getBrowserInfo(req),
      country: this.authService.getCountry(req)
    });
    await forgotPassword.save();
  }

  private async findForgotPasswordByUuid(verifyUuidDto: VerifyUuidDto): Promise<ForgotPassword> {
    const forgotPassword = await this.forgotPasswordModel.findOne({
      verification: verifyUuidDto.verification,
      firstUsed: false,
      finalUsed: false,
      expires: { $gt: new Date() }
    });
    if (!forgotPassword) {
      throw new BadRequestException('Bad request.');
    }
    return forgotPassword;
  }

  private async setForgotPasswordFirstUsed(req: Request, forgotPassword: ForgotPassword) {
    forgotPassword.firstUsed = true;
    forgotPassword.ipChanged = this.authService.getIp(req);
    forgotPassword.browserChanged = this.authService.getBrowserInfo(req);
    forgotPassword.countryChanged = this.authService.getCountry(req);
    await forgotPassword.save();
  }

  private async findForgotPasswordByEmail(resetPasswordDto: ResetPasswordDto): Promise<ForgotPassword> {
    const forgotPassword = await this.forgotPasswordModel.findOne({
      email: resetPasswordDto.email,
      firstUsed: true,
      finalUsed: false,
      expires: { $gt: new Date() }
    });
    if (!forgotPassword) {
      throw new BadRequestException('Bad request.');
    }
    return forgotPassword;
  }

  private async resetUserPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userModel.findOne({
      email: resetPasswordDto.email,
      verified: true
    });
    user.password = resetPasswordDto.password;
    await user.save();
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
