import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
    @ApiProperty({ example: 'uuid-of-contract' })
    @IsNotEmpty()
    @IsString()
    contractId: string;

    @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Max(5)
    rate: number;

    @ApiProperty({ example: 'Great property, very clean and well maintained.', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    reviewText?: string;
}
