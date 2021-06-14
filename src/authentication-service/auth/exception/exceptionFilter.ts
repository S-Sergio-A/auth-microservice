import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException
} from '@nestjs/common';
import {Request, Response} from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    
    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
  }
}

// @Injectable()
// export class NotFoundInterceptor implements NestInterceptor {
//   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
//     // next.handle() is an Observable of the controller's result value
//     return next.handle()
//       .pipe(catchError(error => {
//         if (error instanceof EntityNotFoundError) {
//           throw new NotFoundException(error.message);
//         } else {
//           throw error;
//         }
//       }));
//   }
// }
