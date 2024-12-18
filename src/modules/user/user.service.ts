import { HttpException, HttpStatus, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Observable } from "rxjs";
import { Model, Types } from "mongoose";
import { randomBytes } from "crypto";
import { argon2id, hash, verify } from "argon2";
import { v4 } from "uuid";
import ms from "ms";
import { v2 } from "cloudinary";
import { TokenService } from "../token/token.service";
import { LoginByEmailDto, LoginByPhoneNumberDto, LoginByUsernameDto } from "./dto/login.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import {
  ChangePrimaryData,
  CloudinaryConfigInterface,
  EmailTypeEnum,
  ForgotPassword,
  GLOBAL_ERROR_CODES,
  GlobalErrorCodesEnum,
  LoggerService,
  ModelsNamesEnum,
  RabbitQueuesEnum,
  TokenConfigInterface,
  TokenInterface,
  User,
  USER_ERROR_CODES,
  UserErrorCodesEnum,
  VALIDATION_ERROR_CODES,
  ValidationConfigInterface,
  ValidationErrorCodesEnum,
  Vault
} from "@ssmovzh/chatterly-common-utils";
import {
  AddOrUpdateOptionalDataDto,
  ChangeEmailDto,
  ChangePasswordDto,
  ChangePhoneNumberDto,
  ChangeUsernameDto,
  ForgotPasswordDto,
  VerifyPasswordResetDto
} from "~/modules/user/dto";
import { IpAgentFingerprintInterface, RequestInfoInterface, UserDataInterface } from "~/modules/user/interfaces";
import { MessagePublisherService } from "~/modules/user/message-publisher.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class UserService {
  private readonly TOKEN_CONFIG: TokenConfigInterface;
  private readonly VALIDATION_CONFIG: ValidationConfigInterface;
  private readonly CLOUDINARY_CONFIG: CloudinaryConfigInterface;
  private readonly PROJECTION = {
    email: 1,
    phoneNumber: 1,
    username: 1,
    _id: 1,
    photo: 1,
    firstName: 1,
    lastName: 1,
    birthday: 1,
    verification: 1,
    isActive: 1,
    isBlocked: 1,
    blockExpires: 1,
    verificationExpires: 1,
    loginAttempts: 1
  };

  constructor(
    @InjectModel(ModelsNamesEnum.USERS) private readonly userModel: Model<User>,
    @InjectModel(ModelsNamesEnum.VAULTS) private readonly vaultModel: Model<Vault>,
    @InjectModel(ModelsNamesEnum.FORGOT_PASSWORDS) private readonly forgotPasswordModel: Model<ForgotPassword>,
    @InjectModel(ModelsNamesEnum.CHANGE_PRIMARY_DATA)
    private readonly changePrimaryDataModel: Model<ChangePrimaryData>,
    private readonly authService: TokenService,
    private readonly logger: LoggerService,
    private readonly messagePublisherService: MessagePublisherService,
    private readonly configService: ConfigService
  ) {
    this.TOKEN_CONFIG = this.configService.get<TokenConfigInterface>("jwt");
    this.VALIDATION_CONFIG = this.configService.get<ValidationConfigInterface>("validations");
    this.CLOUDINARY_CONFIG = this.configService.get<CloudinaryConfigInterface>("cloudinary");
  }

  private counter = 0;

  async register(userSignUpDto: SignUpDto): Promise<Omit<User, "password">> {
    if (await this._isExistingEmail(userSignUpDto.email)) {
      const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.EMAIL_ALREADY_EXISTS);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: UserErrorCodesEnum.EMAIL_ALREADY_EXISTS,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }
    if (await this._isExistingUsername(userSignUpDto.username)) {
      const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.USERNAME_ALREADY_EXISTS);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: UserErrorCodesEnum.USERNAME_ALREADY_EXISTS,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }
    if (!(await this._validatePasswordUniqueness(userSignUpDto.password))) {
      const { httpCode, msg } = VALIDATION_ERROR_CODES.get(ValidationErrorCodesEnum.INVALID_PASSWORD);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: ValidationErrorCodesEnum.INVALID_PASSWORD,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }
    if (await this._isExistingPhone(userSignUpDto.phoneNumber)) {
      const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.TEL_ALREADY_EXISTS);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: UserErrorCodesEnum.TEL_ALREADY_EXISTS,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }

    if (userSignUpDto.password === userSignUpDto.passwordVerification) {
      delete userSignUpDto.passwordVerification;
      const salt = randomBytes(10).toString("hex");
      userSignUpDto.password = await this._generatePassword(userSignUpDto.password, salt);

      const user = new this.userModel(userSignUpDto);
      const vault = new this.vaultModel({ user: user._id, salt });

      if (!vault) {
        this.logger.error(`Error: vault for user ${user._id} was not created.`);
        const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
        throw new InternalServerErrorException({
          key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
          code: httpCode,
          message: msg
        });
      }

      user.verification = v4();
      user.isActive = true;
      user.isBlocked = false;
      user.loginAttempts = 0;
      await user.save();
      await vault.save();

      await this.messagePublisherService.publishMessage(RabbitQueuesEnum.ADD_WELCOME_CHAT, { user: user._id });

      await this.messagePublisherService.publishMessage(RabbitQueuesEnum.VERIFY_EMAIL, {
        verificationCode: user.verification,
        email: user.email,
        mailType: EmailTypeEnum.VERIFY_EMAIL
      });

      delete user.password;

      return user;
    }
  }

  async verifyRegistration({ email, verification }: { email: string; verification: string }): Promise<void> {
    const user = await this.userModel.exists({
      email,
      isActive: false,
      verification
    });

    if (!user) {
      const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.USER_NOT_FOUND);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: UserErrorCodesEnum.USER_NOT_FOUND,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }

    await this.userModel.updateOne(
      { email, isActive: false, verification },
      {
        isActive: true,
        verification: "",
        verificationExpires: 0
      }
    );
  }

  async login({
    ip,
    userAgent,
    fingerprint,
    loginUserDto
  }: IpAgentFingerprintInterface & {
    loginUserDto: { rememberMe: boolean } & LoginByEmailDto & LoginByUsernameDto & LoginByPhoneNumberDto;
  }): Promise<UserDataInterface> {
    let user: User;

    const sessionData = {
      ip,
      userAgent,
      fingerprint,
      expiresIn: Date.now() + ms(loginUserDto.rememberMe ? this.TOKEN_CONFIG.longExpiresIn : this.TOKEN_CONFIG.expiresIn),
      createdAt: Date.now()
    };

    if (loginUserDto.username) {
      user = await this.userModel.findOne({ username: loginUserDto.username }, { ...this.PROJECTION });
      if (!user) {
        const { httpCode, msg } = VALIDATION_ERROR_CODES.get(ValidationErrorCodesEnum.INVALID_USERNAME);
        this.logger.error(msg);
        throw new HttpException(
          {
            key: ValidationErrorCodesEnum.INVALID_USERNAME,
            code: httpCode,
            message: msg
          },
          httpCode
        );
      }
    } else if (loginUserDto.phoneNumber) {
      user = await this.userModel.findOne({ phoneNumber: loginUserDto.phoneNumber }, { ...this.PROJECTION });
      if (!user) {
        const { httpCode, msg } = VALIDATION_ERROR_CODES.get(ValidationErrorCodesEnum.INVALID_TEL_NUM);
        this.logger.error(msg);
        throw new HttpException(
          {
            key: ValidationErrorCodesEnum.INVALID_TEL_NUM,
            code: httpCode,
            message: msg
          },
          httpCode
        );
      }
    } else if (loginUserDto.email) {
      user = await this.userModel.findOne({ email: loginUserDto.email });
      if (!user) {
        const { httpCode, msg } = VALIDATION_ERROR_CODES.get(ValidationErrorCodesEnum.INVALID_EMAIL);
        this.logger.error(msg);
        throw new HttpException(
          {
            key: ValidationErrorCodesEnum.INVALID_EMAIL,
            code: httpCode,
            message: msg
          },
          httpCode
        );
      }
    }

    if (!user) {
      const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.USER_NOT_FOUND);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: UserErrorCodesEnum.USER_NOT_FOUND,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }
    if (!user.isActive) {
      const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.USER_HAS_BEEN_BLOCKED);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: UserErrorCodesEnum.USER_HAS_BEEN_BLOCKED,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }

    if (user.isActive && user.isBlocked) {
      const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.USER_HAS_BEEN_BLOCKED);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: UserErrorCodesEnum.USER_HAS_BEEN_BLOCKED,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }

    if (user.isActive && user.blockExpires !== 0 && user.blockExpires < Date.now()) {
      user.isBlocked = false;
      user.blockExpires = 0;
      await user.save();
    }

    const { salt } = await this.vaultModel.findOne({ user: user._id });

    if (!(await verify(user.password, salt + loginUserDto.password))) {
      user.loginAttempts += 1;
      await user.save();
      if (user.loginAttempts >= this.VALIDATION_CONFIG.loginsBeforeBlock) {
        user.blockExpires = Date.now() + ms(this.VALIDATION_CONFIG.hoursToBlock);
        user.isBlocked = true;
        user.loginAttempts = 0;
        await user.save();

        const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.USER_HAS_BEEN_BLOCKED);
        this.logger.error(msg);
        throw new HttpException(
          {
            key: UserErrorCodesEnum.USER_HAS_BEEN_BLOCKED,
            code: httpCode,
            message: msg
          },
          httpCode
        );
      }
    }

    const { accessToken, refreshToken } = await this.authService.generateJWT(user._id.toString(), sessionData);

    if (!accessToken || !refreshToken) {
      this.logger.error(`Error: JWTs were not generated.`);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
    user.loginAttempts = 0;
    await user.save();
    delete user.password;

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  async logout({ userId, ip, userAgent, fingerprint, refreshToken }: RequestInfoInterface): Promise<HttpStatus | Observable<any>> {
    try {
      await this.authService.logout({ userId, ip, userAgent, fingerprint, refreshToken });
      return HttpStatus.OK;
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async changeEmail({
    userId,
    changeEmailDto,
    ip,
    userAgent,
    fingerprint
  }: IpAgentFingerprintInterface & {
    userId: string;
    changeEmailDto: ChangeEmailDto;
  }): Promise<void> {
    const emailMatches = await this._isExistingEmail(changeEmailDto.oldEmail);

    if (!emailMatches) {
      const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.OLD_EMAIL_DOES_NOT_MATCH);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: UserErrorCodesEnum.OLD_EMAIL_DOES_NOT_MATCH,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }
    if (await this._isExistingEmail(changeEmailDto.newEmail)) {
      const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.EMAIL_ALREADY_EXISTS);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: UserErrorCodesEnum.EMAIL_ALREADY_EXISTS,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }

    const userRecord = await this.userModel.findOne({ _id: userId, isActive: true }, { ...this.PROJECTION });
    const userChangeRequests = await this.changePrimaryDataModel.countDocuments({
      user: new Types.ObjectId(userId),
      verified: false
    });

    if (userRecord.isBlocked || userChangeRequests !== 0) {
      const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.USER_HAS_BEEN_BLOCKED);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: UserErrorCodesEnum.USER_HAS_BEEN_BLOCKED,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }

    try {
      const verification = v4();

      await this.userModel.updateOne(
        { _id: new Types.ObjectId(userId), email: changeEmailDto.oldEmail, isActive: true },
        {
          email: changeEmailDto.newEmail,
          isBlocked: true,
          verificationExpires: Date.now() + ms(this.VALIDATION_CONFIG.hoursVerificationIsFresh),
          blockExpires: Date.now() + ms(this.VALIDATION_CONFIG.hoursToBlock),
          verification
        }
      );

      const changePrimaryDataRequest = new this.changePrimaryDataModel({
        user: new Types.ObjectId(userId),
        verification,
        expires: ms(this.VALIDATION_CONFIG.hoursVerificationIsFresh),
        ipOfRequest: ip,
        browserOfRequest: userAgent,
        fingerprintOfRequest: fingerprint,
        dataType: "email",
        verified: false
      });

      await changePrimaryDataRequest.save();

      await this.messagePublisherService.publishMessage(RabbitQueuesEnum.VERIFY_ACCOUNT_UPDATE, {
        verificationCode: verification,
        email: changeEmailDto.newEmail,
        mailType: EmailTypeEnum.VERIFY_EMAIL_CHANGE
      });
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async changeUsername({
    userId,
    changeUsernameDto,
    ip,
    userAgent,
    fingerprint
  }: IpAgentFingerprintInterface & {
    userId: string;
    changeUsernameDto: ChangeUsernameDto;
  }): Promise<void> {
    const usernameMatches = await this._isExistingUsername(changeUsernameDto.oldUsername);

    if (!usernameMatches) {
      const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.OLD_USERNAME_DOES_NOT_MATCH);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: UserErrorCodesEnum.OLD_USERNAME_DOES_NOT_MATCH,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }
    if (await this._isExistingUsername(changeUsernameDto.newUsername)) {
      const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.USERNAME_ALREADY_EXISTS);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: UserErrorCodesEnum.USERNAME_ALREADY_EXISTS,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }

    const user = await this.userModel.findOne(
      {
        _id: new Types.ObjectId(userId),
        isActive: true
      },
      { ...this.PROJECTION }
    );
    const userChangeRequests = await this.changePrimaryDataModel.countDocuments({
      user: new Types.ObjectId(userId),
      verified: false
    });

    if (user.isBlocked || userChangeRequests !== 0) {
      const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.USER_HAS_BEEN_BLOCKED);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: UserErrorCodesEnum.USER_HAS_BEEN_BLOCKED,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }

    try {
      const verification = v4();

      const changePrimaryDataRequest = new this.changePrimaryDataModel({
        user: new Types.ObjectId(userId),
        verification,
        expires: ms(this.VALIDATION_CONFIG.hoursVerificationIsFresh),
        ipOfRequest: ip,
        browserOfRequest: userAgent,
        fingerprintOfRequest: fingerprint,
        dataType: "username",
        verified: false
      });

      await changePrimaryDataRequest.save();

      await this.userModel.updateOne(
        { _id: userId, username: changeUsernameDto.oldUsername, isActive: true },
        {
          username: changeUsernameDto.newUsername,
          isBlocked: true,
          verificationExpires: Date.now() + ms(this.VALIDATION_CONFIG.hoursVerificationIsFresh),
          blockExpires: Date.now() + ms(this.VALIDATION_CONFIG.hoursToBlock),
          verification
        }
      );

      await this.messagePublisherService.publishMessage(RabbitQueuesEnum.VERIFY_ACCOUNT_UPDATE, {
        verificationCode: verification,
        email: user.email,
        mailType: EmailTypeEnum.VERIFY_USERNAME_CHANGE
      });
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async changePhoneNumber({
    userId,
    changePhoneNumberDto,
    ip,
    userAgent,
    fingerprint
  }: IpAgentFingerprintInterface & {
    userId: string;
    changePhoneNumberDto: ChangePhoneNumberDto;
  }): Promise<void> {
    const phoneMatches = await this._isExistingPhone(changePhoneNumberDto.oldPhoneNumber);

    if (!phoneMatches) {
      const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.OLD_TEL_NUM_DOES_NOT_MATCH);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: UserErrorCodesEnum.OLD_TEL_NUM_DOES_NOT_MATCH,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }
    if (await this._isExistingEmail(changePhoneNumberDto.newPhoneNumber)) {
      const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.TEL_ALREADY_EXISTS);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: UserErrorCodesEnum.TEL_ALREADY_EXISTS,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }

    const user = await this.userModel.findOne({ _id: userId, isActive: true }, { ...this.PROJECTION });
    const userChangeRequests = await this.changePrimaryDataModel.countDocuments({ userId, verified: false });

    if (user.isBlocked || userChangeRequests !== 0) {
      const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.USER_HAS_BEEN_BLOCKED);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: UserErrorCodesEnum.USER_HAS_BEEN_BLOCKED,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }

    try {
      const verification = v4();

      await this.userModel.updateOne(
        { _id: userId, phoneNumber: changePhoneNumberDto.oldPhoneNumber, isActive: true },
        {
          phoneNumber: changePhoneNumberDto.newPhoneNumber,
          isBlocked: true,
          verificationExpires: Date.now() + ms(this.VALIDATION_CONFIG.hoursVerificationIsFresh),
          blockExpires: Date.now() + ms(this.VALIDATION_CONFIG.hoursToBlock),
          verification
        }
      );

      const changePrimaryDataRequest = new this.changePrimaryDataModel({
        user: new Types.ObjectId(userId),
        verification,
        expires: ms(this.VALIDATION_CONFIG.hoursVerificationIsFresh),
        ipOfRequest: ip,
        browserOfRequest: userAgent,
        fingerprintOfRequest: fingerprint,
        dataType: "phone",
        verified: false
      });

      await changePrimaryDataRequest.save();

      await this.messagePublisherService.publishMessage(RabbitQueuesEnum.VERIFY_ACCOUNT_UPDATE, {
        verificationCode: verification,
        email: user.email,
        mailType: EmailTypeEnum.VERIFY_TEL_CHANGE
      });
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async changePassword({
    userId,
    changePasswordDto,
    ip,
    userAgent,
    fingerprint
  }: IpAgentFingerprintInterface & {
    userId: string;
    changePasswordDto: ChangePasswordDto;
  }): Promise<void> {
    const user = await this.userModel.findOne({ _id: userId, isActive: true }, { ...this.PROJECTION });
    const { salt: oldSalt } = await this.vaultModel.findOne({ userId });

    if (!(await verify(user.password, oldSalt + changePasswordDto.oldPassword))) {
      const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.OLD_PASSWORD_DOES_NOT_MATCH);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: UserErrorCodesEnum.OLD_PASSWORD_DOES_NOT_MATCH,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    } else if (!(await this._validatePasswordUniqueness(changePasswordDto.newPassword))) {
      const { httpCode, msg } = VALIDATION_ERROR_CODES.get(ValidationErrorCodesEnum.INVALID_PASSWORD);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: ValidationErrorCodesEnum.INVALID_PASSWORD,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }

    const userChangeRequests = await this.changePrimaryDataModel.countDocuments({ userId, verified: false });

    if (user.isBlocked || userChangeRequests !== 0) {
      const { httpCode, msg } = USER_ERROR_CODES.get(UserErrorCodesEnum.USER_HAS_BEEN_BLOCKED);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: UserErrorCodesEnum.USER_HAS_BEEN_BLOCKED,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }

    try {
      const salt = randomBytes(10).toString("hex");
      const verification = v4();
      changePasswordDto.newPassword = await this._generatePassword(changePasswordDto.newPassword, salt);
      await this.userModel.updateOne(
        { _id: userId },
        {
          password: changePasswordDto.newPassword,
          isBlocked: true,
          verificationExpires: Date.now() + ms(this.VALIDATION_CONFIG.hoursVerificationIsFresh),
          blockExpires: Date.now() + ms(this.VALIDATION_CONFIG.hoursToBlock),
          verification
        }
      );
      await this.vaultModel.updateOne({ userId }, { salt });

      const changePrimaryDataRequest = new this.changePrimaryDataModel({
        user: userId,
        verification,
        expires: ms(this.VALIDATION_CONFIG.hoursVerificationIsFresh),
        ipOfRequest: ip,
        browserOfRequest: userAgent,
        fingerprintOfRequest: fingerprint,
        dataType: "password",
        verified: false
      });

      await changePrimaryDataRequest.save();

      await this.messagePublisherService.publishMessage(RabbitQueuesEnum.VERIFY_ACCOUNT_UPDATE, {
        verificationCode: verification,
        email: user.email,
        mailType: EmailTypeEnum.VERIFY_PASSWORD_CHANGE
      });
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async verifyPrimaryDataChange({
    userId,
    verification,
    dataType
  }: {
    userId: string;
    verification: string;
    dataType: "email" | "password" | "username" | "phone";
  }): Promise<Omit<User, "password">> {
    try {
      const primaryDataChangeRequestExists = await this.changePrimaryDataModel.exists({
        userId,
        verification,
        dataType,
        verified: false
      });

      if (!primaryDataChangeRequestExists._id) {
        // TODO
      }

      await this.userModel.updateOne(
        { userId },
        {
          isBlocked: false,
          verification: "",
          verificationExpires: 0,
          blockExpires: 0
        }
      );
      await this.changePrimaryDataModel.updateOne(
        {
          userId,
          verification,
          dataType
        },
        { verified: true }
      );

      return await this.userModel.findOne({ _id: userId, isActive: true }, { ...this.PROJECTION });
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async addOrChangeOptionalData({
    userId,
    optionalDataDto
  }: {
    userId: string;
    optionalDataDto: AddOrUpdateOptionalDataDto;
  }): Promise<Omit<User, "password">> {
    try {
      const user = await this.userModel.findOne({ _id: userId, isActive: true }, { ...this.PROJECTION });

      await this.userModel.updateOne(
        { _id: userId },
        {
          firstName: optionalDataDto.hasOwnProperty("firstName") ? optionalDataDto.firstName : user.firstName,
          lastName: optionalDataDto.hasOwnProperty("lastName") ? optionalDataDto.lastName : user.lastName,
          birthday: optionalDataDto.hasOwnProperty("birthday") ? optionalDataDto.birthday : user.birthday
        }
      );

      return await this.userModel.findOne({ _id: userId }, { ...this.PROJECTION });
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async changePhoto({ userId, photo }: { userId: string; photo: string }): Promise<Omit<User, "password">> {
    try {
      v2.config({
        cloud_name: this.CLOUDINARY_CONFIG.cloudName,
        api_key: this.CLOUDINARY_CONFIG.apiKey,
        api_secret: this.CLOUDINARY_CONFIG.apiSecret,
        secure: true
      });

      const user = await this.userModel.findOne({ _id: userId, isActive: true }, { ...this.PROJECTION });

      const result = await v2.uploader.upload(photo, {
        overwrite: true,
        invalidate: true,
        folder: `Chatterly/${user._id}/`,
        public_id: `profile_pic`
      });

      await this.userModel.updateOne(
        { _id: userId },
        {
          photo: result ? result.secure_url : user.photo
        }
      );

      return await this.userModel.findOne({ _id: userId }, { ...this.PROJECTION });
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async refreshSession({ ip, userAgent, fingerprint, refreshToken, userId }: RequestInfoInterface): Promise<TokenInterface> {
    const sessionData = {
      ip,
      userAgent,
      fingerprint,
      expiresIn: Date.now() + ms(this.TOKEN_CONFIG.refreshExpiresIn),
      createdAt: Date.now()
    };

    try {
      const tokens = await this.authService.refreshSession(
        {
          refreshToken,
          userId
        },
        sessionData
      );
      const { accessToken, refreshToken: updatedRefreshToken } = tokens;

      return {
        accessToken,
        refreshToken: updatedRefreshToken
      };
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async resetPassword({
    ip,
    userAgent,
    fingerprint,
    forgotPasswordDto
  }: IpAgentFingerprintInterface & {
    forgotPasswordDto: ForgotPasswordDto;
  }): Promise<void> {
    const userExists = await this.userModel.exists({ email: forgotPasswordDto.email, isActive: true });

    if (!userExists._id) {
      this.logger.error(`Error: user with email ${forgotPasswordDto.email} doesn't exist.`);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }

    try {
      const forgotPassword = await this.forgotPasswordModel.create({
        email: forgotPasswordDto.email,
        verification: v4(),
        expires: Date.now() + ms(this.VALIDATION_CONFIG.hoursVerificationIsFresh),
        ipOfRequest: ip,
        browserOfRequest: userAgent,
        fingerprintOfRequest: fingerprint
      });
      await forgotPassword.save();
      await this.messagePublisherService.publishMessage(RabbitQueuesEnum.VERIFY_PASSWORD_RESET, {
        verificationCode: forgotPassword.verification,
        email: forgotPassword.email,
        mailType: EmailTypeEnum.RESET_PASSWORD
      });
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async verifyPasswordReset({ email, verifyUuidDto }: { email: string; verifyUuidDto: VerifyPasswordResetDto }): Promise<void> {
    const forgotPassword = await this.forgotPasswordModel.exists({
      verification: verifyUuidDto.verification
    });

    if (!forgotPassword || verifyUuidDto.newPassword !== verifyUuidDto.newPasswordVerification) {
      const { httpCode, msg } = VALIDATION_ERROR_CODES.get(ValidationErrorCodesEnum.PASSWORDS_DOES_NOT_MATCH);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: ValidationErrorCodesEnum.PASSWORDS_DOES_NOT_MATCH,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }

    try {
      delete verifyUuidDto.newPasswordVerification;

      const user = await this.userModel.findOne({ email }, { ...this.PROJECTION });

      const salt = randomBytes(10).toString("hex");
      const newPassword = await this._generatePassword(verifyUuidDto.newPassword, salt);
      await this.userModel.updateOne({ _id: user._id }, { password: newPassword });
      await this.vaultModel.updateOne({ user: user._id }, { salt });
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  async findById(userId: string): Promise<Omit<User, "password">> {
    try {
      return this.userModel.findOne({ _id: userId }, { ...this.PROJECTION });
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  private async _isExistingEmail(email: string): Promise<boolean> {
    try {
      const exists = await this.userModel.exists({ email });
      return !!exists?._id;
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  private async _isExistingUsername(username: string): Promise<boolean> {
    try {
      const exists = await this.userModel.exists({ username });
      return !!exists?._id;
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  private async _isExistingPhone(phoneNumber: string): Promise<boolean> {
    try {
      const exists = await this.userModel.exists({ phoneNumber });
      return !!exists?._id;
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  private async _isExistingPassword(password: string): Promise<boolean> {
    try {
      const exists = await this.userModel.exists({ password });
      return !!exists?._id;
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  private async _validatePasswordUniqueness(password: string): Promise<boolean> {
    try {
      const salt = randomBytes(10).toString("hex");
      const saltedPassword = await this._generatePassword(password, salt);

      if (this.counter <= this.VALIDATION_CONFIG.maxPasswordAttempts) {
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
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }

  private async _generatePassword(password: string, salt: string): Promise<string> {
    try {
      password = salt + password;

      return hash(password, {
        hashLength: 40,
        memoryCost: 8192,
        timeCost: 4,
        type: argon2id
      });
    } catch (error) {
      this.logger.error(error, error.trace);
      const { httpCode, msg } = GLOBAL_ERROR_CODES.get(GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR);
      throw new InternalServerErrorException({
        key: GlobalErrorCodesEnum.INTERNAL_SERVER_ERROR,
        code: httpCode,
        message: msg
      });
    }
  }
}
