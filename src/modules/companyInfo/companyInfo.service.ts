import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanyInfo, CompanySection } from 'src/common/entities/companyInfo.entity';
import { Repository } from 'typeorm';


@Injectable()
export class CompanyInfoService {
    constructor(
        @InjectRepository(CompanyInfo)
        private readonly companyInfoRepo: Repository<CompanyInfo>,
    ) { }

    async getAll(): Promise<CompanyInfo[]> {
        return this.companyInfoRepo.find();
    }

    async getBySection(section: CompanySection): Promise<CompanyInfo | null> {
        return this.companyInfoRepo.findOne({ where: { sectionKey: section } });
    }

    async addInfo(data: Partial<CompanyInfo>): Promise<CompanyInfo> {
        const info = this.companyInfoRepo.create(data);
        return this.companyInfoRepo.save(info);
    }

    async updateInfo(id: string, data: Partial<CompanyInfo>): Promise<CompanyInfo | null> {
        await this.companyInfoRepo.update(id, data);
        return this.companyInfoRepo.findOne({ where: { id } });
    }

    async deleteInfo(id: string): Promise<void> {
        await this.companyInfoRepo.delete(id);
    }
}
