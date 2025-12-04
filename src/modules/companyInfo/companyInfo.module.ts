import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyInfo } from 'src/common/entities/companyInfo.entity';
import { CompanyInfoService } from './companyInfo.service';
import { CompanyInfoController } from './companyInfo.Controller';

@Module({
    imports: [TypeOrmModule.forFeature([CompanyInfo])],
    providers: [CompanyInfoService],
    controllers: [CompanyInfoController],
})
export class CompanyInfoModule { }
