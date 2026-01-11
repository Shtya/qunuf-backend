import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from 'src/common/entities/contract.entity';
import { Property } from 'src/common/entities/property.entity';
import { Settings } from 'src/common/entities/settings.entity';
import { NotificationModule } from '../notification/notification.module';
import { User } from 'src/common/entities/user.entity';
import { RenewRequest } from 'src/common/entities/renew_request';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contract,
      User,
      Property,
      Settings,
      RenewRequest
    ]),
    NotificationModule, // ⬅️ required for NotificationService
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService]
})
export class ContractsModule { }