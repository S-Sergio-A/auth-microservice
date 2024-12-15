import { Injectable } from "@nestjs/common";
import * as amqp from "amqplib";
import { ConfigService } from "@nestjs/config";
import { LoggerService, QueueResponseInterface, RabbitConfigInterface } from "@ssmovzh/chatterly-common-utils";

@Injectable()
export class RabbitProducerService {
  private readonly config: RabbitConfigInterface;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService
  ) {
    this.logger.setContext(RabbitProducerService.name);
    this.config = this.configService.get<RabbitConfigInterface>("rabbitConfig");
  }

  async sendMessage(queueName: string, tasks: any[]): Promise<void> {
    try {
      const connection = await amqp.connect(this.config);
      const channel = await connection.createChannel();
      await channel.assertQueue(queueName, {
        durable: true
      });

      for (let i = 0; i < tasks.length; i++) {
        const msg = JSON.stringify(tasks[i]);
        channel.sendToQueue(queueName, Buffer.from(msg));
      }

      setTimeout(() => {
        channel.close();
        connection.close();
      }, 500);

      this.logger.verbose(`${tasks.length} tasks added to queue ${queueName}`);
    } catch (error) {
      this.logger.error(error, error.trace);
      throw error;
    }
  }

  async getQueueInfo(queueName: string): Promise<QueueResponseInterface> {
    let connection: amqp.Connection;
    let channel: {
      assertQueue: (arg0: string, arg1: { durable: boolean }) => any;
    };
    try {
      connection = await amqp.connect(this.config);
      channel = await connection.createChannel();
      const result = await channel.assertQueue(queueName, {
        durable: true
      });
      await this.cleanup(channel, connection);

      return result;
    } catch (error) {
      this.logger.error(error, error.trace);
      throw error;
    }
  }

  async cleanup(
    channel: {
      assertQueue?: (arg0: string, arg1: { durable: boolean }) => any;
      close?: any;
    },
    connection: amqp.Connection
  ) {
    try {
      if (channel) {
        await channel.close();
      }
      if (connection) {
        await connection.close();
      }
    } catch (error) {
      this.logger.error(error, error.trace);
    }
  }
}
