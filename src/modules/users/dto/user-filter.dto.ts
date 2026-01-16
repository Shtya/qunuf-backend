import { IsOptional, IsString, IsEnum, IsIn } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UserStatus, UserRole } from 'src/common/entities/user.entity';
import { OmitType } from '@nestjs/swagger';

export class UserFilterDto extends PaginationDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    status?: UserStatus | 'all' = 'all';

    @IsOptional()
    role?: UserRole | 'all' = 'all';

    @IsOptional()
    @IsIn(['created_at', 'name', 'email', 'status', 'role', 'lastLogin'])
    declare sortBy?: 'created_at' | 'name' | 'email' | 'status' | 'role' | 'lastLogin';
}

export class UserExportFilterDto extends OmitType(UserFilterDto, ['page'] as const) { }
