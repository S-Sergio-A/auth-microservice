import { Injectable } from "@nestjs/common";
import { RabbitQueuesEnum } from "@ssmovzh/chatterly-common-utils";
import { ClientService } from "~/modules/client/client.service";

@Injectable()
export class ClientHandlers {
  private handlers = new Map<RabbitQueuesEnum, any>();

  constructor(private readonly clientService: ClientService) {
    this.handlers.set(RabbitQueuesEnum.HANDLE_APPEAL, this.clientService.contact.bind(this.clientService));
    this.handlers.set(RabbitQueuesEnum.GENERATE_CLIENT_TOKEN, this.clientService.generateToken.bind(this.clientService));
  }

  get(action: RabbitQueuesEnum): () => any {
    const handlerFunction = this.handlers.get(action);

    if (!handlerFunction) {
      throw new Error("Unknown queue type.");
    }

    return handlerFunction;
  }
}
