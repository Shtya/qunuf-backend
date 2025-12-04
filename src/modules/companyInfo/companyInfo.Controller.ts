import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { CompanyInfoService } from './companyInfo.service';
import { CompanyInfo, CompanySection } from 'src/common/entities/companyInfo.entity';

@Controller('company-info')
export class CompanyInfoController {
    constructor(private readonly companyInfoService: CompanyInfoService) { }

    @Get()
    async getAll(): Promise<CompanyInfo[]> {
        return this.companyInfoService.getAll();
    }

    @Get(':section')
    async getBySection(@Param('section') section: CompanySection): Promise<CompanyInfo | null> {
        return this.companyInfoService.getBySection(section);
    }

    @Post()
    async addInfo(@Body() data: Partial<CompanyInfo>): Promise<CompanyInfo> {
        return this.companyInfoService.addInfo(data);
    }

    @Put(':id')
    async updateInfo(@Param('id') id: string, @Body() data: Partial<CompanyInfo>): Promise<CompanyInfo | null> {
        return this.companyInfoService.updateInfo(id, data);
    }

    @Delete(':id')
    async deleteInfo(@Param('id') id: string): Promise<void> {
        return this.companyInfoService.deleteInfo(id);
    }
}
