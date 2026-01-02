import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsEnum, ValidateIf, Matches, IsDate, Validate, MinLength } from 'class-validator';
import { IdentityType } from 'src/common/entities/user.entity';

export class UpdateUserDto {
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    @MaxLength(50, { message: 'Name must be at most 50 characters long' })
    name: string;

    @Matches(/^(009665|9665|\+9665|05|5)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/, {
        message: 'Invalid Saudi phone number format',
    })
    phoneNumber: string;

    @Type(() => Date)
    @IsNotEmpty({ message: 'Birth date is required' })
    @IsDate()
    @Validate(val => {
        const eighteenYearsAgo = new Date();
        eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
        return val <= eighteenYearsAgo;
    }, { message: 'User must be at least 18 years old' })
    birthDate: Date;


    @IsEnum(IdentityType, { message: 'Invalid identity type' })
    @IsNotEmpty({ message: 'Indetity type is required' })
    identityType: IdentityType;

    @ValidateIf(o => o.identityType === IdentityType.OTHER)//should be less than .... 
    @IsString({ message: 'Identity other type must be a string' })
    @IsNotEmpty({ message: 'Identity other type is required when identityType is OTHER' })
    identityOtherType: string;


    @IsString()//should be ... for ach type
    @IsNotEmpty({ message: 'ID is required' })
    @Matches(/^[a-zA-Z0-9]*$/, { message: 'Identity number must contain only letters and numbers' })
    @MinLength(3)
    @MaxLength(20)
    identityNumber: string;

    // @ValidateIf(o =>
    //     o.identityType === IdentityType.GCC_ID ||
    //     o.identityType === IdentityType.PASSPORT ||
    //     o.identityType === IdentityType.OTHER
    // )
    // @IsNotEmpty({ message: 'Identity issue country is required for GCC_ID, PASSPORT, and OTHER' })
    // identityIssueCountry: number; // FK to Country entity (country_id)
}