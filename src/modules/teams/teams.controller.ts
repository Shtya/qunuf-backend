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
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { imageUploadConfig } from 'src/common/utils/file.util';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Auth } from 'src/common/decorators/auth.decorator';
import { UserRole } from 'src/common/entities/user.entity';

@ApiTags('Teams')
@Controller('teams')
export class TeamsController {
    constructor(private readonly svc: TeamsService) { }

    @Get()
    @ApiOperation({ summary: 'List team members with pagination' })
    @ApiQuery({ name: 'page', type: Number, required: false })
    @ApiQuery({ name: 'limit', type: Number, required: false })
    @ApiResponse({ status: 200, description: 'Team members fetched successfully' })
    list(
        @Query('page') page = 1,
        @Query('limit') limit = 15
    ) {
        page = Number(page);
        limit = Number(limit);
        return this.svc.findAll(page, limit);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get team member by ID' })
    @ApiParam({ name: 'id', type: 'string' })
    @ApiResponse({ status: 200, description: 'Team member fetched successfully' })
    @ApiResponse({ status: 404, description: 'Team member not found' })
    get(@Param('id') id: string) {
        return this.svc.findOne(id);
    }

    @Post()
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create a new team member' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: CreateTeamDto })
    @ApiResponse({ status: 201, description: 'Team member created successfully' })
    @UseInterceptors(FileInterceptor('image', imageUploadConfig('teams')))
    async create(
        @UploadedFile() file: any,
        @Body() dto: CreateTeamDto
    ) {
        let path = '';
        if (file) {
            path = `uploads/images/teams/${file.filename}`;
        }
        return this.svc.create(dto, path);
    }

    @Put(':id')
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update a team member' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UpdateTeamDto })
    @ApiResponse({ status: 200, description: 'Team member updated successfully' })
    @ApiResponse({ status: 404, description: 'Team member not found' })
    @UseInterceptors(FileInterceptor('image', imageUploadConfig('teams')))
    async update(
        @Param('id') id: string,
        @UploadedFile() file: any,
        @Body() dto: UpdateTeamDto
    ) {
        let path = '';
        if (file) {
            path = `uploads/images/teams/${file.filename}`;
        }

        return this.svc.update(id, dto, path);
    }

    @Delete(':id')
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete a team member' })
    @ApiParam({ name: 'id', type: 'string' })
    @ApiResponse({ status: 200, description: 'Team member deleted successfully' })
    @ApiResponse({ status: 404, description: 'Team member not found' })
    remove(@Param('id') id: string) {
        return this.svc.remove(id);
    }
}
