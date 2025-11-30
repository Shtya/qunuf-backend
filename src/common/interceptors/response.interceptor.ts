import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                const statusCode = context.switchToHttp().getResponse().statusCode;

                // If data is an object with "message" and "data" keys, use them directly
                if (
                    data &&
                    typeof data === 'object' &&
                    ('message' in data ||
                        'data' in data)
                ) {
                    return {
                        data: data?.data || null,
                        message: data?.message || 'Success',
                        errors: data.errors ?? null,
                        statusCode,
                    };
                }

                // Otherwise, wrap the raw data
                return {
                    data,
                    message: 'Success',
                    errors: null,
                    statusCode,
                };
            }),
        );
    }
}
