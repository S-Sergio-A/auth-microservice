import { Controller, Post, Body, Put, UseFilters, HttpCode, HttpStatus, Req, Get, Res } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags, ApiOperation } from "@nestjs/swagger";
import { Request, Response } from "express";
import { ClientService } from "./client.service";
import { InternalExceptionFilter } from "../exceptions/filters/Internal.exception-filter";
import { RequestBodyExceptionFilter } from "../exceptions/filters/RequestBody.exception-filter";
import { ValidationExceptionFilter } from "../exceptions/filters/Validation.exception-filter";
import { ContactFormValidationPipe } from "../pipes/validation/contact-form.validation.pipe";
import { ContactFormDto } from "./contact-form.dto";

@UseFilters(ValidationExceptionFilter)
@UseFilters(RequestBodyExceptionFilter)
@UseFilters(InternalExceptionFilter)
@Controller("client")
@ApiTags("Contact Form")
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post("/contact")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Handle an appeal." })
  @ApiCreatedResponse({})
  async register(@Req() req: Request, @Body(new ContactFormValidationPipe()) contactFormDto: ContactFormDto) {
    return await this.clientService.contact(req, contactFormDto);
  }

  @Get("/token")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Generate a client access-token." })
  @ApiCreatedResponse({})
  async generateToken(@Req() req: Request, @Res() res: Response) {
    return await this.clientService.generateToken(req, res);
  }
}
