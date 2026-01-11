import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, Matches, IsDate, IsEnum, MinLength, Validate, ValidateIf, ValidateNested, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { IdentityType } from 'src/common/entities/user.entity';



// export class UpdateAddressDto {
//     @ApiProperty({ example: 'b0256268-80f6-41f2-9856-78e7636e0d37', description: 'UUID of the state' })
//     @IsOptional()
//     @IsString()
//     stateId: string;

//     @ApiProperty({ example: 'Riyadh' })
//     @IsOptional()
//     @IsString()
//     city: string;

//     @ApiProperty({ example: 'King Fahd Road' })
//     @IsOptional()
//     @IsString()
//     streetName: string;

//     @ApiProperty({ example: '1234' })
//     @IsOptional()
//     @IsString()
//     buildingNumber: string;

//     @ApiPropertyOptional({ example: '12211' })
//     @IsOptional()
//     @IsString()
//     postalCode?: string;

//     @ApiPropertyOptional({ example: '7890' })
//     @IsOptional()
//     @IsString()
//     additionalNumber?: string;
// }

export class UpdateUserDto {
    @ApiProperty({ example: 'Ahmad Al-Saud' })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    name: string;

    @ApiProperty({ example: '+966501234567', description: 'Saudi Phone Number' })
    @Matches(/^(009665|9665|\+9665|05|5)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/, {
        message: 'Invalid Saudi phone number format',
    })
    phoneNumber: string;

    @ApiProperty({ example: '1990-01-01', description: 'Birth date (YYYY-MM-DD)' })
    @Type(() => Date)
    @IsOptional()
    @IsDate()
    @Validate((val) => {
        const eighteenYearsAgo = new Date();
        eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
        return val <= eighteenYearsAgo;
    }, { message: 'User must be at least 18 years old' })
    birthDate: Date;

    @ApiProperty({ enum: IdentityType, example: IdentityType.NATIONAL_ID })
    @IsEnum(IdentityType, { message: 'Invalid identity type' })
    @IsOptional()
    identityType: IdentityType;

    @ApiPropertyOptional({ example: 'Special Passport' })
    @ValidateIf((o) => o.identityType === IdentityType.OTHER)
    @IsString()
    @IsOptional()
    identityOtherType?: string;

    @ApiProperty({ example: '1023456789' })
    @IsString()
    @IsOptional()
    @Matches(/^[a-zA-Z0-9]*$/)
    @MinLength(3)
    @MaxLength(20)
    identityNumber: string;

    @ApiPropertyOptional({ example: 'a1111111-2222-3333-4444-555555555555' })
    @IsOptional()
    @IsString()
    identityIssueCountryId?: string;

    @ApiPropertyOptional({ example: 'b1111111-2222-3333-4444-555555555555' })
    @IsOptional()
    @IsString()
    nationalityId?: string;


    @IsString()
    @IsOptional()
    @Length(8, 8, { message: 'National Address Code must be exactly 8 characters' })
    @Matches(/^[A-Z]{4}\d{4}$|^[0-9]{8}$/, { message: 'National Address Code must be 8 alphanumeric characters' })
    shortAddress: string;

    //We will store at database short address number instead of detailed address
    // @ApiPropertyOptional({ type: UpdateAddressDto })
    // @IsOptional()
    // @ValidateNested()
    // @Type(() => UpdateAddressDto)
    // address?: UpdateAddressDto;
}

export class UpdateUserProfileDto extends PartialType(UpdateUserDto) { }