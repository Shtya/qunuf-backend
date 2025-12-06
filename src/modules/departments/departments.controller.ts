import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    UploadedFile,
    UseInterceptors,
    UseGuards,
    Req,
    BadRequestException,
    Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageUploadConfig } from 'src/common/utils/file.util';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Departments')
@Controller('departments')
export class DepartmentsController {
    constructor(private readonly svc: DepartmentsService) { }

    @Get()
    list(
        @Query('page') page = 1,
        @Query('limit') limit = 15
    ) {
        page = Number(page);
        limit = Number(limit);

        const data = this.svc.findAll(page, limit);
        return data
    }

    @Get(':id')
    get(@Param('id') id: string) {
        return this.svc.findOne(id);
    }

    @Post()
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: CreateDepartmentDto })
    @UseInterceptors(FileInterceptor('image', imageUploadConfig('departments')))
    async create(@UploadedFile() file: any, @Body() dto: CreateDepartmentDto, @Req() req: any) {
        let path = '';
        if (file) {
            path = `uploads/images/departments/${file.filename}`;
        }
        return this.svc.create(dto, path);
    }

    @Put(':id')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('image', imageUploadConfig('departments')))
    async update(
        @Param('id') id: string,
        @UploadedFile() file: any,
        @Body() dto: UpdateDepartmentDto,
    ) {
        let path = '';
        if (file) {
            path = `uploads/images/departments/${file.filename}`;
        }

        return this.svc.update(id, dto, path);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.svc.remove(id);
    }
}
