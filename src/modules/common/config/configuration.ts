import * as process from "process";
import * as dotenv from "dotenv";
import {
  AppConfigInterface,
  CloudinaryConfigInterface,
  RabbitConfigInterface,
  TokenConfigInterface,
  ValidationConfigInterface
} from "@ssmovzh/chatterly-common-utils";

dotenv.config();

export default () => ({
  app: {
    port: +process.env.PORT,
    environment: process.env.ENVIRONMENT,
    clientUrl: process.env.CLIENT_URL
  } as AppConfigInterface,
  mongoConfig: {
    username: process.env.MONGO_USERNAME,
    password: process.env.MONGO_PASSWORD,
    clusterUrl: process.env.MONGO_CLUSTER_URL
  },
  rabbitConfig: {
    protocol: "amqp",
    hostname: process.env.RABBIT_HOST,
    port: process.env.RABBIT_PORT ? +process.env.RABBIT_PORT : 5672,
    username: process.env.RABBIT_USERNAME,
    password: process.env.RABBIT_PASSWORD
  } as RabbitConfigInterface,
  cloudinary: {
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME
  } as CloudinaryConfigInterface,
  jwt: {
    secret: process.env.JWT_SECRET,
    clientSecret: process.env.CLIENTS_JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRATION_TIME,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION_TIME,
    longExpiresIn: process.env.JWT_EXPIRATION_TIME_LONG
  } as TokenConfigInterface,
  validations: {
    maxRefreshSessions: +process.env.MAX_REFRESH_SESSIONS_COUNT,
    maxPasswordAttempts: +process.env.MAX_PASSWORD_ATTEMPTS,
    hoursVerificationIsFresh: process.env.HOURS_TO_VERIFY,
    hoursToBlock: process.env.HOURS_TO_BLOCK,
    loginsBeforeBlock: +process.env.LOGIN_ATTEMPTS_TO_BLOCK
  } as ValidationConfigInterface
});
