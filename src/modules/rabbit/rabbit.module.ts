import { Global, Module, Provider } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RabbitConfigInterface } from "@ssmovzh/chatterly-common-utils";
import * as amqp from "amqplib";
import { RabbitConsumerManagerService } from "~/modules/rabbit/rabbit-manager.service";
import { ClientModule } from "~/modules/client/client.module";
import { UserModule } from "~/modules/user/user.module";

const RABBITMQ_CONNECTION = "RABBITMQ_CONNECTION";
const RABBITMQ_CHANNEL = "RABBITMQ_CHANNEL";

const rabbitMQProviders: Provider[] = [
  {
    provide: RABBITMQ_CONNECTION,
    useFactory: async (configService: ConfigService) => {
      const rabbitmqConfig = configService.get<RabbitConfigInterface>("rabbitConfig");
      return await amqp.connect(rabbitmqConfig);
    },
    inject: [ConfigService]
  },
  {
    provide: RABBITMQ_CHANNEL,
    useFactory: async (connection: amqp.Connection) => {
      return await connection.createChannel();
    },
    inject: [RABBITMQ_CONNECTION]
  }
];

@Global()
@Module({
  imports: [ConfigModule, ClientModule, UserModule],
  providers: [...rabbitMQProviders, RabbitConsumerManagerService],
  exports: [...rabbitMQProviders, RabbitConsumerManagerService]
})
export class RabbitModule {}