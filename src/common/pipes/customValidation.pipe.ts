import { Injectable, ValidationPipe, ValidationError, BadRequestException } from '@nestjs/common';

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
    constructor() {
        super({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
            exceptionFactory: async (errors: ValidationError[]) => {
                const plainErrors = await this.formatValidationErrors(errors);

                throw new BadRequestException({
                    statusCode: 400,
                    message: 'Validation failed',
                    errors: plainErrors,
                });
            },
        });
    }
    private async formatValidationErrors(
        errors: ValidationError[],
    ): Promise<{ field: string; messages: string[] | string }[]> {
        const formattedErrors: { field: string; messages: string[] | string }[] = [];

        for (const error of errors) {
            if (error.children && error.children.length > 0) {
                const nestedErrors = await this.formatValidationErrors(error.children);

                nestedErrors.forEach((nestedError) => {
                    formattedErrors.push({
                        field: `${error.property}.${nestedError.field}`,
                        messages: nestedError.messages,
                    });
                });
            } else {
                const constraints = error.constraints || {};
                const messages = Object.values(constraints);

                formattedErrors.push({
                    field: error.property,
                    messages: messages.length === 1 ? messages[0] : messages,
                });
            }
        }

        return formattedErrors;
    }

}
