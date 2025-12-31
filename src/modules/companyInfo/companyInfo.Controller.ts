import { Controller, Get, Post, Put, Delete, Param, Body, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { CompanyInfoService } from './companyInfo.service';
import { CreateCompanyInfoDto } from './dto/create-company-info.dto';
import { UpdateCompanyInfoDto } from './dto/update-company-info.dto';
import { imageUploadConfig } from 'src/common/utils/file.util';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBadRequestResponse, ApiBody, ApiConsumes, ApiNotFoundResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorators/auth.decorator';
import { UserRole } from 'src/common/entities/user.entity';

@Controller('company-info')
@ApiTags('Company Info')
export class CompanyInfoController {
    constructor(private readonly companyInfoService: CompanyInfoService) { }


    @Get()
    @ApiOperation({ summary: 'Get all company info sections' })
    @ApiResponse({ status: 200, description: 'Company info fetched successfully' })
    async getAll() {
        return this.companyInfoService.getAll();
    }


    @Get(':id')
    @ApiOperation({ summary: 'Get company info by ID' })
    @ApiResponse({ status: 200, description: 'Company section fetched successfully' })
    @ApiNotFoundResponse({ description: 'Company section not found' })
    async getBySection(@Param('id') id: string) {
        return this.companyInfoService.getBySection(id);
    }


    @Post()
    @Auth(UserRole.ADMIN)
    @UseInterceptors(FileInterceptor('image', imageUploadConfig('company-info')))
    @ApiOperation({ summary: 'Create company info with optional image upload' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Company info payload and optional image',
        type: CreateCompanyInfoDto,
    })
    @ApiResponse({ status: 201, description: 'Company section added successfully' })
    @ApiBadRequestResponse({ description: 'Section already exists' })
    async addInfo(
        @UploadedFile() file: any,
        @Body() dto: CreateCompanyInfoDto,
    ) {
        const path = file ? `uploads/images/company-info/${file.filename}` : '';
        return this.companyInfoService.addInfo(dto, path);
    }


    @Put(':id')
    @Auth(UserRole.ADMIN)
    @UseInterceptors(FileInterceptor('image', imageUploadConfig('company-info')))
    @ApiOperation({ summary: 'Update company info section' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Update data with optional image',
        type: UpdateCompanyInfoDto,
    })
    @ApiResponse({ status: 200, description: 'Company section updated successfully' })
    @ApiNotFoundResponse({ description: 'Company section not found' })
    async updateInfo(
        @UploadedFile() file: any,
        @Param('id') id: string,
        @Body() dto: UpdateCompanyInfoDto,
    ) {
        const path = file ? `uploads/images/company-info/${file.filename}` : '';
        return this.companyInfoService.updateInfo(id, dto, path);
    }


    @Delete(':id')
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete company info section' })
    @ApiResponse({ status: 200, description: 'Company section deleted successfully' })
    @ApiNotFoundResponse({ description: 'Company section not found' })
    async deleteInfo(@Param('id') id: string) {
        return this.companyInfoService.deleteInfo(id);
    }
}
