import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { ZodError } from 'zod';
import { Response } from 'express';

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    return response.status(400).json({
      statusCode: 400,
      message: 'Validation failed',
      errors: exception.errors,
    });
  }
}
