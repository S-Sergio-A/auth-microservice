import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LoggerService, RabbitQueuesEnum } from "@ssmovzh/chatterly-common-utils";
import { Channel } from "amqplib";
import { RabbitConsumerService } from "~/modules/rabbit/rabbit-consumer.service";
import { UserExecutor } from "~/modules/user/user-executor.service";
import { ClientExecutor } from "~/modules/client/client-executor.service";

@Injectable()
export class RabbitConsumerManagerService implements OnModuleInit, OnModuleDestroy {
  private consumers: RabbitConsumerService[];

  constructor(
    @Inject("RABBITMQ_CHANNEL") private channel: Channel,
    private readonly userExecutor: UserExecutor,
    private readonly clientExecutor: ClientExecutor,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService
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

    this.consumers = clientQueueNames.map((queueName) => {
      const loggerInstance = this.logger.clone();

      return new RabbitConsumerService(this.channel, this.clientExecutor, loggerInstance, this.configService, queueName);
    });

    this.consumers = [
      ...this.consumers,
      ...userQueueNames.map((queueName) => {
        const loggerInstance = this.logger.clone();

        return new RabbitConsumerService(this.channel, this.userExecutor, loggerInstance, this.configService, queueName);
      })
    ];

    await Promise.all(this.consumers.map((consumer) => consumer.onModuleInit()));
  }

  async onModuleDestroy() {
    await Promise.all(this.consumers.map((consumer) => consumer.onModuleDestroy()));
  }
}
