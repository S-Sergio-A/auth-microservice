import { MessagePattern, Payload, Transport } from "@nestjs/microservices";
import { Controller, UseFilters } from "@nestjs/common";
import { ExceptionFilter } from "../exceptions/filters/Exception.filter";
import { RequestInfo } from "../user/interfaces/request-info.interface";
import { ContactFormDto } from "./contact-form.dto";
import { ClientService } from "./client.service";

@UseFilters(ExceptionFilter)
@Controller("client")
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @MessagePattern({ cmd: "handle-appeal" }, Transport.REDIS)
  async register(@Payload() contactFormDto: ContactFormDto) {
    return await this.clientService.contact(contactFormDto);
  }

  @MessagePattern({ cmd: "generate-client-token" }, Transport.REDIS)
  async generateToken(@Payload() data: RequestInfo) {
    return await this.clientService.generateToken(data);
  }
}
