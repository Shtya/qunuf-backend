// accept-contract.dto.ts
import { IsNumber, IsOptional, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptContractDto {
    @ApiProperty({ example: true, description: 'Whether to send renewal reminder automatically' })
    @IsOptional()
    @IsBoolean()
    shouldSendRenewalNotify?: boolean;

    @ApiProperty({ example: 300, required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    renewalDiscountAmount?: number;

    @ApiProperty({ example: 3, required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(5) // كحد أقصى 10 سنوات مثلاً
    requiredMonthsForIncentive?: number;
}