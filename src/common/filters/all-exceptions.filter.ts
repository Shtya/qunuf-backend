import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
    Injectable,
    Logger,
    HttpException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Request, Response } from 'express';

@Injectable()
@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionsFilter.name);
    private readonly isDev = process.env.NODE_ENV === 'development';

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();
        const req = ctx.getRequest<Request>();

        let errorResponse: {
            status: number;
            message: string;
            errors?: any;
            detail?: any
        };

        // Determine the type of error and handle accordingly
        switch (true) {
            case exception instanceof QueryFailedError:
                errorResponse = this.handleDatabaseError(exception as QueryFailedError);
                break;
            case exception instanceof HttpException:
                errorResponse = this.handleHttpError(exception as HttpException);
                break;
            default:
                errorResponse = this.handleUnknownError(exception);
                break;
        }

        // Log critical errors (500+)
        if (errorResponse.status >= 500) {
            this.logger.error(
                `${req.method} ${req.url} - Error: ${errorResponse.message}`,
                exception instanceof Error ? exception.stack : JSON.stringify(exception),
            );
        }

        res.status(errorResponse.status).json({
            statusCode: errorResponse.status,
            message: errorResponse.message,
            errors: errorResponse.errors || null,
            ...(this.isDev && errorResponse.detail ? { detail: errorResponse.detail } : {}),
        });
    }

    private handleDatabaseError(exception: QueryFailedError) {
        const driverError = (exception as any).driverError;

        return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            // Only show DB message in dev; generic message in prod
            message: this.isDev ? (driverError?.message || 'Database error') : 'Internal server error',
            detail: driverError?.detail || null,
        };
    }

    private handleHttpError(exception: HttpException) {
        const status = exception.getStatus();
        const response = exception.getResponse();

        return {
            status,
            message: typeof response === 'object' ? (response as any).message : response,
            errors: (response as any).errors || null,
        };
    }

    private handleUnknownError(exception: unknown) {
        return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: this.isDev && exception instanceof Error ? exception.message : 'An unexpected error occurred. Please try again later.',
        };
    }
}