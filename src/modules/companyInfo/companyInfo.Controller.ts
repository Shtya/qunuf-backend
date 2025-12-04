import { Controller, Get, Post, Put, Delete, Param, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CompanyInfoService } from './companyInfo.service';
import { CompanyInfo } from 'src/common/entities/companyInfo.entity';
import { CreateCompanyInfoDto } from './dto/create-company-info.dto';
import { UpdateCompanyInfoDto } from './dto/update-company-info.dto';
import { imageUploadConfig } from 'src/common/utils/file.util';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('company-info')
export class CompanyInfoController {
    constructor(private readonly companyInfoService: CompanyInfoService) { }

    @Get()
    async getAll(): Promise<CompanyInfo[]> {
        return this.companyInfoService.getAll();
    }

    @Get(':id')
    async getBySection(@Param('id') id: string) {
        return this.companyInfoService.getBySection(id);
    }

    @Post()
    @UseInterceptors(FileInterceptor('image', imageUploadConfig('company-info')))
    async addInfo(@UploadedFile() file: any, @Body() dto: CreateCompanyInfoDto): Promise<CompanyInfo> {
        const imagePath = file ? file.path : undefined;

        return this.companyInfoService.addInfo(dto, imagePath);
    }

    @Put(':id')
    @UseInterceptors(FileInterceptor('image', imageUploadConfig('company-info')))
    async updateInfo(
        @UploadedFile() file: any,
        @Param('id') id: string,
        @Body() dto: UpdateCompanyInfoDto
    ): Promise<CompanyInfo | null> {
        const imagePath = file ? file.path : undefined;
        return this.companyInfoService.updateInfo(id, dto, imagePath);
    }


    @Delete(':id')
    async deleteInfo(@Param('id') id: string) {
        return this.companyInfoService.deleteInfo(id);
    }
}


