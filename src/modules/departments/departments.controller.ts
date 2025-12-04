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
    list() {
        return this.svc.findAll();
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
        const imagePath = file ? file.path : undefined;
        if (!imagePath) {
            throw new BadRequestException("No image uploaded")
        }
        return this.svc.create(dto, imagePath);
    }

    @Put(':id')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('image', imageUploadConfig('departments')))
    async update(
        @Param('id') id: string,
        @UploadedFile() file: any,
        @Body() dto: UpdateDepartmentDto,
    ) {
        const imagePath = file ? file.path : undefined;
        if (!imagePath) {
            throw new BadRequestException("No image uploaded")
        }
        return this.svc.update(id, dto, imagePath);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.svc.remove(id);
    }
}
