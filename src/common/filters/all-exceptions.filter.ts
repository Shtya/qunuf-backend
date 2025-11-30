import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
    Injectable,
    Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Request, Response } from 'express';

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();
        const req = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Something went wrong. Please try again later.';
        let errors = null;
        let detail = null;

        if (exception instanceof QueryFailedError) {
            // Database error
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            const driverError: any = (exception as any).driverError;

            // Return DB detail in separate field
            detail = driverError?.detail || null;
            message = driverError?.message || 'Database error';
        } else if (exception instanceof Error && 'getStatus' in exception) {
            // HttpException
            const httpEx = exception as any;
            status = httpEx.getStatus();
            const resp = httpEx.getResponse();

            if (typeof resp === 'object' && resp !== null) {
                message = resp.message ?? httpEx.message;
                errors = resp.errors ?? null;
            } else {
                message = resp as string;
            }

        }

        if (status >= 500) {
            this.logger.error(
                `Unhandled exception on ${req.method} ${req.url}`,
                exception instanceof Error ? exception.stack : JSON.stringify(exception),
            );
        }

        // Send unified response
        res.status(status).json({
            data: null,
            message,
            errors,
            statusCode: status,
            ...(detail ? { detail } : {}),  // include DB detail if present
        });
    }
}
