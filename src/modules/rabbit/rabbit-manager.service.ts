import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LoggerService, RabbitQueuesEnum } from "@ssmovzh/chatterly-common-utils";
import { RabbitConsumerService } from "~/modules/rabbit/rabbit-consumer.service";
import { UserExecutor } from "~/modules/user/user-executor.service";
import { ClientExecutor } from "~/modules/client/client-executor.service";
import { RabbitService } from "~/modules/rabbit/rabbit.service";

@Injectable()
export class RabbitConsumerManagerService implements OnModuleInit, OnModuleDestroy {
  private consumers: RabbitConsumerService[];

  constructor(
    private readonly userExecutor: UserExecutor,
    private readonly clientExecutor: ClientExecutor,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly rabbitService: RabbitService
  ) {}

  async onModuleInit() {
    const clientQueueNames = [RabbitQueuesEnum.HANDLE_APPEAL, RabbitQueuesEnum.GENERATE_CLIENT_TOKEN];

    const userQueueNames = [
      RabbitQueuesEnum.SIGN_UP,
      RabbitQueuesEnum.VERIFY_SIGN_UP,
      RabbitQueuesEnum.LOGIN,
      RabbitQueuesEnum.LOG_OUT,
      RabbitQueuesEnum.FORGOT_PASSWORD,
      RabbitQueuesEnum.VERIFY_PASSWORD_RESET,
      RabbitQueuesEnum.CHANGE_EMAIL,
      RabbitQueuesEnum.CHANGE_USERNAME,
      RabbitQueuesEnum.CHANGE_PASSWORD,
      RabbitQueuesEnum.CHANGE_PHOTO,
      RabbitQueuesEnum.VERIFY_ACCOUNT_UPDATE,
      RabbitQueuesEnum.CHANGE_DETAILS,
      RabbitQueuesEnum.CHANGE_PHOTO,
      RabbitQueuesEnum.REFRESH_SESSION
    ];

    this.consumers = await Promise.all(
      clientQueueNames.map(async (queueName) => {
        const loggerInstance = this.logger.clone();
        const channel = await this.rabbitService.createChannel();

        return new RabbitConsumerService(channel, this.clientExecutor, loggerInstance, this.configService, queueName);
      })
    );

    this.consumers = [
      ...this.consumers,
      ...(await Promise.all(
        userQueueNames.map(async (queueName) => {
          const loggerInstance = this.logger.clone();
          const channel = await this.rabbitService.createChannel();

          return new RabbitConsumerService(channel, this.userExecutor, loggerInstance, this.configService, queueName);
        })
      ))
    ];

    await Promise.all(this.consumers.map((consumer) => consumer.onModuleInit()));
  }

  async onModuleDestroy() {
    await Promise.all(this.consumers.map((consumer) => consumer.onModuleDestroy()));
  }
}
