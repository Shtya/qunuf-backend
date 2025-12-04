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
    list() {
        return this.svc.findAll();
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
        const imagePath = file ? file.path : undefined;
        if (!imagePath) throw new BadRequestException('No image uploaded');
        return this.svc.create(dto, imagePath);
    }

    @Put(':id')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('image', imageUploadConfig('teams')))
    async update(@Param('id') id: string, @UploadedFile() file: any, @Body() dto: UpdateTeamDto) {
        const imagePath = file ? file.path : undefined;
        if (!imagePath) throw new BadRequestException('No image uploaded');
        return this.svc.update(id, dto, imagePath);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.svc.remove(id);
    }
}
