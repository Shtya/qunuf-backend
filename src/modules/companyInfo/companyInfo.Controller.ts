import { Controller, Get, Post, Put, Delete, Param, Body, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { CompanyInfoService } from './companyInfo.service';
import { CompanyInfo } from 'src/common/entities/companyInfo.entity';
import { CreateCompanyInfoDto } from './dto/create-company-info.dto';
import { UpdateCompanyInfoDto } from './dto/update-company-info.dto';
import { imageUploadConfig } from 'src/common/utils/file.util';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';

@Controller('company-info')
export class CompanyInfoController {
    constructor(private readonly companyInfoService: CompanyInfoService) { }

    @Get()
    async getAll(): Promise<CompanyInfo[]> {
        return this.companyInfoService.getAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get company info by ID', description: 'Fetches a single info by their unique identifier' })
    async getBySection(@Param('id') id: string) {
        return this.companyInfoService.getBySection(id);
    }


    @Post()
    @UseInterceptors(FileInterceptor('image', imageUploadConfig('company-info')))
    @ApiOperation({ summary: 'Add company info with optional image upload' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Company info payload with optional image',
        type: CreateCompanyInfoDto,
    })
    async addInfo(
        @UploadedFile() file: any,
        @Body() dto: CreateCompanyInfoDto,
    ): Promise<CompanyInfo> {
        let path = '';
        if (file) {
            path = `uploads/images/company-info/${file.filename}`;
        }
        return this.companyInfoService.addInfo(dto, path);
    }

    @Put(':id')
    @UseInterceptors(FileInterceptor('image', imageUploadConfig('company-info')))
    async updateInfo(
        @UploadedFile() file: any,
        @Param('id') id: string,
        @Body() dto: UpdateCompanyInfoDto
    ): Promise<CompanyInfo | null> {
        let path: string = '';
        if (file) {
            path = `uploads/images/company-info/${file.filename}`;
        }
        return this.companyInfoService.updateInfo(id, dto, path);
    }


    @Delete(':id')
    async deleteInfo(@Param('id') id: string) {
        return this.companyInfoService.deleteInfo(id);
    }
}


