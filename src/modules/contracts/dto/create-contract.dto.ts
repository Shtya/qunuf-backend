import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateContractDto {
    @ApiProperty({ example: 'uuid-of-property' })
    @IsNotEmpty()
    @IsString()
    propertyId: string;

    @ApiProperty({ example: '2026-02-01' })
    @IsDateString()
    startDate: string;

    @ApiProperty({
        example: 12,
        description: 'Number of months if rentType is MONTHLY, or years if rentType is YEARLY'
    })
    @IsOptional()
    @Transform(({ value }) => (value === undefined || value === null ? 1 : Number(value)))
    @IsInt()
    @Min(1)
    duration: number;

    // Optional: Tenant can propose different terms initially, 
    // but usually they accept defaults. We'll handle this in service.
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(10000)
    proposedTerms?: string;
}