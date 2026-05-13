import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceCategory } from 'src/common/entities/service-provider.entity';

export class CreateServiceProviderDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional()
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({ enum: ServiceCategory })
    @IsEnum(ServiceCategory)
    serviceCategory: ServiceCategory;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional()
    @IsInt()
    @Min(1)
    @IsOptional()
    slaHours?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    address?: string;
}
