import { MessagePattern, Payload, Transport } from "@nestjs/microservices";
import { Controller, UseFilters } from "@nestjs/common";
import { RequestBodyExceptionFilter } from "../exceptions/filters/RequestBody.exception-filter";
import { ValidationExceptionFilter } from "../exceptions/filters/Validation.exception-filter";
import { InternalExceptionFilter } from "../exceptions/filters/Internal.exception-filter";
import { RequestInfo } from "../user/interfaces/request-info.interface";
import { ContactFormDto } from "./contact-form.dto";
import { ClientService } from "./client.service";

@UseFilters(ValidationExceptionFilter)
@UseFilters(RequestBodyExceptionFilter)
@UseFilters(InternalExceptionFilter)
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
