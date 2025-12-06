export class Result<T = any> {
    data: T | null;
    message: string;
    errors: any | null;
    statusCode: number;
    isOk: boolean;

    constructor(data: T | null, message: string, errors: any | null, statusCode: number) {
        this.data = data;
        this.message = message;
        this.errors = errors;
        this.statusCode = statusCode;
        this.isOk = statusCode >= 200 && statusCode < 300; // true if 2xx
    }
    // Success responses
    static ok<T>(data: T | null = null, message = 'Success', statusCode = 200) {
        return new Result(data, message, null, statusCode);
    }

    static created<T>(data: T | null = null, message = 'Created successfully') {
        return new Result(data, message, null, 201);
    }

    static badRequest<T>(message = 'Bad Request', errors: any = null, data: T | null = null) {
        return new Result(data, message, errors, 400);
    }

    static unauthorized<T>(message = 'Unauthorized', errors: any = null, data: T | null = null) {
        return new Result(data, message, errors, 401);
    }

    static forbidden<T>(message = 'Forbidden', errors: any = null, data: T | null = null) {
        return new Result(data, message, errors, 403);
    }

    static notFound<T>(message = 'Not Found', errors: any = null, data: T | null = null) {
        return new Result(data, message, errors, 404);
    }

    static conflict<T>(message = 'Conflict', errors: any = null, data: T | null = null) {
        return new Result(data, message, errors, 409);
    }

    static internal<T>(message = 'Internal Server Error', errors: any = null, data: T | null = null) {
        return new Result(data, message, errors, 500);
    }

    static validationFail<T>(errors: any, message = 'Error', statusCode = 400, data: T | null = null) {
        return new Result(data, message, errors, statusCode);
    }
}
