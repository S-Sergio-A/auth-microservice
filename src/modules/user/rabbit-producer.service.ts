import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LoggerService, QueueResponseInterface, RabbitConfigInterface } from "@ssmovzh/chatterly-common-utils";
import { v4 as uuidv4 } from "uuid";
import { connect, Connection } from "amqplib";

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

  async sendMessage(queueName: string, data: any): Promise<any> {
    const connection = await connect(
      this.config?.uri || {
        protocol: this.config.protocol,
        hostname: this.config.hostname,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password
      }
    );
    const channel = await connection.createChannel();

    const replyQueue = await channel.assertQueue("", { exclusive: true }); // Temporary reply queue
    const correlationId = uuidv4(); // Unique ID for this RPC call

    channel.sendToQueue(queueName, Buffer.from(JSON.stringify({ ...data, action: queueName })), {
      correlationId,
      replyTo: replyQueue.queue
    });

    // Wait for the response
    return new Promise((resolve, reject) => {
      channel.consume(
        replyQueue.queue,
        (msg) => {
          if (msg.properties.correlationId === correlationId) {
            resolve(JSON.parse(msg.content.toString())); // Return response
          }
        },
        { noAck: true }
      );

      // Timeout for response
      setTimeout(() => {
        reject(new Error("Timeout: No response from consumer"));
        channel.close();
        connection.close();
      }, 50000);
    });
  }

  async getQueueInfo(queueName: string): Promise<QueueResponseInterface> {
    let connection: Connection;
    let channel: {
      assertQueue: (arg0: string, arg1: { durable: boolean }) => any;
    };
    try {
      connection = await connect(
        this.config?.uri || {
          protocol: this.config.protocol,
          hostname: this.config.hostname,
          port: this.config.port,
          username: this.config.username,
          password: this.config.password
        }
      );
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
    connection: Connection
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
