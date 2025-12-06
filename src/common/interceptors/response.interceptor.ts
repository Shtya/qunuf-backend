import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Result } from '../utils/Result';


@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Result<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<Result<T>> {
        return next.handle().pipe(
            map((data) => {
                // If already a Result instance, just return it
                if (data instanceof Result) {
                    // Optionally, also sync HTTP status code with Result.statusCode
                    const response = context.switchToHttp().getResponse();
                    response.statusCode = data.statusCode;
                    return data;
                }


                return Result.ok(data, 'Success', 200);
            }),
        );
    }
}
