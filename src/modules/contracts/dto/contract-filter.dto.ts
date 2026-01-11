import { IsOptional, IsString, IsEnum, IsIn } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ContractStatus } from 'src/common/entities/contract.entity';


export class ContractFilterDto extends PaginationDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(ContractStatus)
    status?: ContractStatus | 'all' = 'all';

    @IsOptional()
    @IsIn(['created_at', 'totalAmount', 'durationInMonths'])
    declare sortBy?: 'created_at' | 'totalAmount' | 'durationInMonths';

}