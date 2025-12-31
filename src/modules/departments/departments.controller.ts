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
    Req,
    Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageUploadConfig } from 'src/common/utils/file.util';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Auth } from 'src/common/decorators/auth.decorator';
import { UserRole } from 'src/common/entities/user.entity';


@ApiTags('Departments')
@Controller('departments')
export class DepartmentsController {
    constructor(private readonly svc: DepartmentsService) { }

    @Get()
    @ApiOperation({ summary: 'List departments with pagination' })
    @ApiQuery({ name: 'page', type: Number, required: false })
    @ApiQuery({ name: 'limit', type: Number, required: false })
    @ApiResponse({ status: 200, description: 'Departments fetched successfully' })
    list(
        @Query('page') page = 1,
        @Query('limit') limit = 15
    ) {
        page = Number(page);
        limit = Number(limit);
        return this.svc.findAll(page, limit);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single department' })
    @ApiParam({ name: 'id', type: 'string' })
    @ApiResponse({ status: 200, description: 'Department fetched successfully' })
    @ApiResponse({ status: 404, description: 'Department not found' })
    get(@Param('id') id: string) {
        return this.svc.findOne(id);
    }

    @Post()
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create a new department' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: CreateDepartmentDto })
    @ApiResponse({ status: 201, description: 'Department created successfully' })
    @UseInterceptors(FileInterceptor('image', imageUploadConfig('departments')))
    async create(
        @UploadedFile() file: any,
        @Body() dto: CreateDepartmentDto
    ) {
        let path = '';
        if (file) {
            path = `uploads/images/departments/${file.filename}`;
        }
        return this.svc.create(dto, path);
    }

    @Put(':id')
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update a department' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UpdateDepartmentDto })
    @ApiResponse({ status: 200, description: 'Department updated successfully' })
    @ApiResponse({ status: 404, description: 'Department not found' })
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
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete a department' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({ status: 200, description: 'Department deleted successfully' })
    @ApiResponse({ status: 404, description: 'Department not found' })
    remove(@Param('id') id: string) {
        return this.svc.remove(id);
    }
}
