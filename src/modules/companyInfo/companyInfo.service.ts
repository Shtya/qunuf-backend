import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanyInfo, CompanySection } from 'src/common/entities/companyInfo.entity';
import { Repository } from 'typeorm';
import { CreateCompanyInfoDto } from './dto/create-company-info.dto';
import { UpdateCompanyInfoDto } from './dto/update-company-info.dto';
import { deleteFile } from 'src/common/utils/file.util';
import { Result } from 'src/common/utils/Result';


@Injectable()
export class CompanyInfoService {
    constructor(
        @InjectRepository(CompanyInfo)
        private readonly companyInfoRepo: Repository<CompanyInfo>,
    ) { }

    async getAll() {
        const records = await this.companyInfoRepo.find();
        return Result.ok(records, 'Company info fetched successfully');
    }

    async getBySection(id: string) {
        const item = await this.companyInfoRepo.findOne({ where: { id } });
        if (!item) {
            return Result.badRequest('Company section not found', 404, null);
        }
        return Result.ok(item, 'Company section fetched successfully');
    }

    async addInfo(data: CreateCompanyInfoDto, imagePath: string) {
        const exists = await this.companyInfoRepo.findOne({
            where: { section: data.section },
        });

        if (exists) {
            return Result.badRequest(`Section "${data.section}" already exists`, 400, null);
        }

        const info = this.companyInfoRepo.create({
            ...data,
            imagePath,
        });

        const saved = await this.companyInfoRepo.save(info);
        return Result.ok(saved, 'Company section added successfully');
    }



    async updateInfo(id: string, data: UpdateCompanyInfoDto, imagePath: string) {
        const existing = await this.companyInfoRepo.findOne({ where: { id } });
        if (!existing) {
            return Result.badRequest('Company section not found', 404, null);
        }

        // If a new image is uploaded → delete old one
        if (imagePath && existing.imagePath) {
            await deleteFile(existing.imagePath);
        }

        await this.companyInfoRepo.update(existing.id, {
            ...data,
            ...(imagePath ? { imagePath } : {}),
        });

        const updated = await this.companyInfoRepo.findOne({ where: { id: existing.id } });
        return Result.ok(updated, 'Company section updated successfully');
    }

    async deleteInfo(id: string) {
        const existing = await this.companyInfoRepo.findOne({ where: { id } });
        if (!existing) {
            return Result.badRequest('Company section not found', 404, null);
        }

        await this.companyInfoRepo.delete(id);
        return Result.ok(null, 'Company section deleted successfully');
    }
}
