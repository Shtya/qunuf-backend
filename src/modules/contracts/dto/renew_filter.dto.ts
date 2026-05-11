import { IsEnum, IsIn, IsOptional } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { RenewStatus } from "src/common/entities/renew_request";

export class RenewFilterDto extends PaginationDto {
    @IsOptional()
    status?: RenewStatus | 'all' = 'all';

    @IsOptional()
    @IsIn(['created_at', 'offeredDiscountAmount'])
    declare sortBy?: 'created_at' | 'offeredDiscountAmount';
}