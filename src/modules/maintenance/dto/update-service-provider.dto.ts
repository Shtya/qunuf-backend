import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ProviderStatus } from 'src/common/entities/service-provider.entity';
import { CreateServiceProviderDto } from './create-service-provider.dto';

export class UpdateServiceProviderDto extends PartialType(CreateServiceProviderDto) {
    @IsEnum(ProviderStatus)
    @IsOptional()
    status?: ProviderStatus;
}
