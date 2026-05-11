import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CreateContractDto } from './create-contract.dto';

export class AdminCreateContractDto extends CreateContractDto {
    @ApiProperty({ example: 'uuid-of-tenant' })
    @IsNotEmpty()
    @IsString()
    tenantId: string;

    @ApiProperty({ required: false, default: false, description: 'Skip acceptance workflow and set contract directly to ACTIVE' })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === true || value === 'true')
    directActivate?: boolean;
}
