import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppError } from '../errors';
@Catch()
export class CatchFilter implements ExceptionFilter {
    private readonly logger = new Logger(CatchFilter.name)
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';

    if (exception instanceof AppError) {
      status = exception.statusCode;
      message = exception.message;

      if (exception.isOperational) {
        this.logger.warn(`[${status}] ${message}`);
      } else {
        this.logger.error(`Non-operational error: ${message}`);
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();
      message =
        typeof responseBody === 'string'
          ? responseBody
          : (responseBody as any).message || message;

      this.logger.warn(`[${status}] ${message}`);
    } else if (exception instanceof Error) {
      this.logger.error(exception.message);
    } else {
      this.logger.error(`Unknown error: ${JSON.stringify(exception)}`);
    }

    response.status(status).json({
      success: false,
      message,
    });
  }
}