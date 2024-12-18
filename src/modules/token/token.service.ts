import { HttpException, HttpStatus, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectionNamesEnum,
  GLOBAL_ERROR_CODES,
  GlobalErrorCodesEnum,
  JWT_ERROR_CODES,
  JwtErrorCodesEnum,
  LoggerService,
  ModelsNamesEnum,
  RefreshSession,
  SessionDataInterface,
  TokenConfigInterface,
  TokenInterface,
  ValidationConfigInterface
} from "@ssmovzh/chatterly-common-utils";
import { Observable } from "rxjs";
import { Model } from "mongoose";
import ms from "ms";
import { RequestInfoInterface } from "~/modules/user/interfaces";
import { RefreshSessionDto } from "~/modules/token/dto";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TokenService {
  private readonly TOKEN_CONFIG: TokenConfigInterface;
  private readonly VALIDATION_CONFIG: ValidationConfigInterface;

  constructor(
    @InjectModel(ModelsNamesEnum.REFRESH_SESSIONS) private readonly refreshSessionModel: Model<RefreshSession>,
    private readonly logger: LoggerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.TOKEN_CONFIG = this.configService.get<TokenConfigInterface>("jwt");
    this.VALIDATION_CONFIG = this.configService.get<ValidationConfigInterface>("validations");
  }

  async generateJWT(userId: string, sessionData: SessionDataInterface): Promise<TokenInterface> {
    try {
      const { userAgent, ip, fingerprint, expiresIn, createdAt } = sessionData;

      return {
        accessToken: await this._generateAccessToken(userId, expiresIn),
        refreshToken: await this._addRefreshSession({
          userId,
          ip,
          userAgent,
          fingerprint,
          createdAt,
          expiresIn: ms(this.TOKEN_CONFIG.refreshExpiresIn)
        })
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

  async refreshSession(
    {
      refreshToken,
      userId
    }: {
      refreshToken: string;
      userId: string;
    },
    sessionData: SessionDataInterface
  ): Promise<TokenInterface> {
    const { userAgent, ip, fingerprint } = sessionData;

    if (typeof refreshToken === "string") {
      refreshToken = refreshToken.split('"').join("");
    } else if (Array.isArray(refreshToken)) {
      const { httpCode, msg } = JWT_ERROR_CODES.get(JwtErrorCodesEnum.REFRESH_TOKEN_NOT_PROVIDED);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: JwtErrorCodesEnum.REFRESH_TOKEN_NOT_PROVIDED,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }

    const rows = await this.refreshSessionModel.findOne({
      userId,
      ip,
      userAgent,
      fingerprint,
      refreshToken
    });

    if (!rows) {
      const { httpCode, msg } = JWT_ERROR_CODES.get(JwtErrorCodesEnum.INVALID_REFRESH_SESSION);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: JwtErrorCodesEnum.INVALID_REFRESH_SESSION,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }

    if (Date.now() > rows.createdAt + rows.expiresIn) {
      const { httpCode, msg } = JWT_ERROR_CODES.get(JwtErrorCodesEnum.SESSION_EXPIRED);
      this.logger.error(msg);
      throw new HttpException(
        {
          key: JwtErrorCodesEnum.SESSION_EXPIRED,
          code: httpCode,
          message: msg
        },
        httpCode
      );
    }

    try {
      const newSessionData = {
        ip,
        userAgent,
        fingerprint,
        createdAt: Date.now(),
        expiresIn: Date.now() + ms(this.TOKEN_CONFIG.expiresIn)
      };

      return await this.generateJWT(userId, newSessionData);
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

  async logout({ userId, ip, userAgent, fingerprint, refreshToken }: RequestInfoInterface): Promise<HttpStatus | Observable<any>> {
    try {
      await this.refreshSessionModel
        .deleteOne({
          userId,
          ip,
          userAgent,
          fingerprint,
          refreshToken
        })
        .exec();
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

  public async generateClientsAccessToken(clientId: string, ip: string): Promise<string> {
    return this.jwtService.sign(
      { clientId, ip },
      {
        algorithm: "HS512",
        subject: clientId.toString(),
        expiresIn: ms(this.TOKEN_CONFIG.refreshExpiresIn),
        secret: this.TOKEN_CONFIG.clientSecret
      }
    );
  }

  private async _addRefreshSession(refreshSessionDto: RefreshSessionDto) {
    if (await this._isValidSessionsCount(refreshSessionDto.userId)) {
      return this._addRefreshSessionRecord(refreshSessionDto);
    } else {
      await this._wipeAllUserRefreshSessions(refreshSessionDto.userId);
      return this._addRefreshSessionRecord(refreshSessionDto);
    }
  }

  private async _isValidSessionsCount(userId: string) {
    try {
      const sessionsCount = await this.refreshSessionModel
        .countDocuments({
          userId: userId
        })
        .exec();
      return sessionsCount < this.VALIDATION_CONFIG.maxRefreshSessions;
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

  private async _addRefreshSessionRecord(refreshSessionDto: RefreshSessionDto) {
    const refreshToken = await this._generateRefreshToken(refreshSessionDto.userId, refreshSessionDto.expiresIn);

    try {
      refreshSessionDto.refreshToken = refreshToken;
      const createdRefreshSession = new this.refreshSessionModel(refreshSessionDto);
      await createdRefreshSession.save();
      return refreshToken;
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

  private async _wipeAllUserRefreshSessions(userId: string): Promise<boolean> {
    try {
      await this.refreshSessionModel
        .deleteMany({
          userId: userId
        })
        .exec();
      return true;
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

  private async _generateAccessToken(userId: string, expiresIn: number): Promise<string> {
    return this.jwtService.sign(
      { userId },
      {
        algorithm: "HS512",
        subject: userId.toString(),
        expiresIn,
        secret: this.TOKEN_CONFIG.secret
      }
    );
  }

  private async _generateRefreshToken(userId: string, expiresIn: number): Promise<string> {
    return this.jwtService.sign(
      { userId },
      {
        algorithm: "HS512",
        subject: userId.toString(),
        expiresIn,
        secret: this.TOKEN_CONFIG.refreshSecret
      }
    );
  }
}
