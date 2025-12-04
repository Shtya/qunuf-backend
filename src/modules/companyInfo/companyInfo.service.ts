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

    async getAll(): Promise<CompanyInfo[]> {
        return this.companyInfoRepo.find();
    }

    async getBySection(id: string): Promise<CompanyInfo | null> {
        return this.companyInfoRepo.findOne({ where: { id } });
    }
    async addInfo(data: CreateCompanyInfoDto, imagePath: string): Promise<CompanyInfo> {
        // Check if section already exists
        const exists = await this.companyInfoRepo.findOne({
            where: { section: data.sectionKey },
        });

        if (exists) {
            throw new BadRequestException(`Section "${data.sectionKey}" already exists`);
        }

        const info = this.companyInfoRepo.create({
            ...data,
            imagePath: imagePath || null,
        });

        return this.companyInfoRepo.save(info);
    }


    async updateInfo(
        id: string,
        data: UpdateCompanyInfoDto,
        imagePath: string
    ) {
        const existing = await this.companyInfoRepo.findOne({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException(`Section not found`);
        }

        // If a new image is uploaded → delete old one
        if (imagePath) {
            if (existing.imagePath) {
                await deleteFile(existing.imagePath);
            }
        }

        await this.companyInfoRepo.update(existing.id, { ...data, imagePath });

        return this.companyInfoRepo.findOne({
            where: { id: existing.id },
        });
    }

    async deleteInfo(id: string): Promise<void> {
        await this.companyInfoRepo.delete(id);
    }
}
