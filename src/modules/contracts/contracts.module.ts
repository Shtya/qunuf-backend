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
import { ContractSubscriber } from './contract.subscriber';
import { EmailModule } from '../email/email.module';

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
    EmailModule, // ⬅️ required for EmailService
  ],
  controllers: [ContractsController],
  providers: [ContractsService, ContractSubscriber],
  exports: [ContractsService]
})
export class ContractsModule { }