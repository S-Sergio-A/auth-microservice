import { Injectable } from "@nestjs/common";
import { AuthDataInterface, LoggerService } from "@ssmovzh/chatterly-common-utils";
import { ClientHandlers } from "~/modules/client/client-handlers.service";

@Injectable()
export class ClientExecutor {
  constructor(
    private readonly handlers: ClientHandlers,
    private readonly logger: LoggerService
  ) {
    this.logger.setContext(ClientExecutor.name);
  }

  async handleMessage(message: string): Promise<any> {
    let data: any;

    try {
      data = JSON.parse(message);
    } catch (error) {
      this.logger.error(`Error parsing message: ${error}.`, error.trace);
      return;
    }

    const handler = await this._getHandler(data);

    if (!handler) return;

    try {
      const response = await handler(data);
      this.logger.verbose(`Message processed successfully.`);
      return response;
    } catch (error) {
      this.logger.error(`Error: ${error}`, error.trace);
    }
  }

  protected async _getHandler(data: any & AuthDataInterface): Promise<(data: any) => any> {
    try {
      this.logger.log(`Start processing action: ${data.action}.`);
      const handler = this.handlers.get(data.action);

      if (!handler) {
        throw new Error(`Handler for action ${data.action} not found.`);
      }

      return handler;
    } catch (error) {
      this.logger.error(`Error: ${error}`, error.trace);
    }
  }
}
