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
    BadRequestException,
    Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { imageUploadConfig } from 'src/common/utils/file.util';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';


@ApiTags('Teams')
@Controller('teams')
export class TeamsController {
    constructor(private readonly svc: TeamsService) { }


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
    @ApiBody({ type: CreateTeamDto })
    @UseInterceptors(FileInterceptor('image', imageUploadConfig('teams')))
    async create(@UploadedFile() file: any, @Body() dto: CreateTeamDto, @Req() req: any) {
        let path = '';
        if (file) {
            path = `uploads/images/teams/${file.filename}`;
        }
        return this.svc.create(dto, path);
    }

    @Put(':id')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('image', imageUploadConfig('teams')))
    async update(@Param('id') id: string, @UploadedFile() file: any, @Body() dto: UpdateTeamDto) {
        let path = '';
        if (file) {
            path = `uploads/images/teams/${file.filename}`;
        }

        return this.svc.update(id, dto, path);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.svc.remove(id);
    }
}
