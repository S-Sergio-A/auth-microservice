import { ExceptionFilter, Catch, ArgumentsHost } from "@nestjs/common";
import { Request, Response } from "express";
import { RequestBodyException } from "../RequestBody.exception";

@Catch(RequestBodyException)
export class RequestBodyExceptionFilter implements ExceptionFilter {
  catch(exception: RequestBodyException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    response.status(200).json({
      statusCode: exception.response.code,
      message: exception.response.message,
      timestamp: new Date().toUTCString(),
      path: request.url
    });
  }
}
