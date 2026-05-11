import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
} from 'class-validator';

export function IsYearRange(min: number, max: number, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isYearRange',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if (!value) return true; // allow optional
                    const year = new Date(value).getFullYear();
                    return year >= min && year <= max;
                },
                defaultMessage(args: ValidationArguments) {
                    return `Construction year must be between ${min} and ${max}`;
                },
            },
        });
    };
}


export function IsPastDate(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isPastDate',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    if (!value) return false;
                    const date = new Date(value);
                    return !isNaN(date.getTime()) && date <= new Date();
                },
                defaultMessage(args: ValidationArguments) {
                    return 'Document issue date cannot be in the future';
                },
            },
        });
    };
}


export function IsFutureDateOrToday(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isFutureDateOrToday',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    if (!value) return false;
                    const date = new Date(value);
                    if (isNaN(date.getTime())) return false;

                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // normalize to start of day

                    return date >= today;
                },
                defaultMessage(args: ValidationArguments) {
                    return 'Start date cannot be in the past';
                },
            },
        });
    };
}
