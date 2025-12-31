import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanyInfo, CompanySection } from 'src/common/entities/companyInfo.entity';
import { Repository } from 'typeorm';
import { CreateCompanyInfoDto } from './dto/create-company-info.dto';
import { UpdateCompanyInfoDto } from './dto/update-company-info.dto';
import { deleteFile } from 'src/common/utils/file.util';

@Injectable()
export class CompanyInfoService {
    constructor(
        @InjectRepository(CompanyInfo)
        private readonly companyInfoRepo: Repository<CompanyInfo>,
    ) { }

    async getAll() {
        const records = await this.companyInfoRepo.find();
        return records;
    }

    async getBySection(id: string) {
        const item = await this.companyInfoRepo.findOne({ where: { id } });
        if (!item) {
            throw new BadRequestException('Company section not found');
        }
        return item;
    }

    async addInfo(data: CreateCompanyInfoDto, imagePath: string) {
        const exists = await this.companyInfoRepo.findOne({
            where: { section: data.section },
        });

        if (exists) {
            throw new BadRequestException(`Section "${data.section}" already exists`);
        }

        const info = this.companyInfoRepo.create({
            ...data,
            imagePath,
        });

        const saved = await this.companyInfoRepo.save(info);
        return saved;
    }


    async updateInfo(id: string, dto: UpdateCompanyInfoDto, imagePath: string) {
        const existing = await this.companyInfoRepo.findOne({ where: { id } });
        if (!existing) {
            throw new BadRequestException('Company section not found');
        }

        Object.assign(existing, dto);
        if (imagePath) {
            await deleteFile(existing.imagePath);
            existing.imagePath = imagePath;
        }
        // 4. Save and return
        return await this.companyInfoRepo.save(existing);
    }

    async deleteInfo(id: string) {
        const existing = await this.companyInfoRepo.findOne({ where: { id } });
        if (!existing) {
            throw new BadRequestException('Company section not found');
        }

        if (existing.imagePath) await deleteFile(existing.imagePath);

        await this.companyInfoRepo.delete(id);
        return null;
    }
}
