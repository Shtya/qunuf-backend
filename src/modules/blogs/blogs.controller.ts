
import { BlogsService } from "./blogs.service";

import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    UploadedFile,
    UseInterceptors,
    Query,
    Put,
    Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CreateBlogDto } from "./dto/create-blog.dto";
import { imageUploadConfig } from "src/common/utils/file.util";
import { UpdateBlogDto } from "./dto/update-blog.dto";
import { Auth } from "src/common/decorators/auth.decorator";
import { UserRole } from "src/common/entities/user.entity";

@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController {
    constructor(private readonly blogsService: BlogsService) { }

    @Get()
    @ApiOperation({ summary: 'Get blogs with cursor pagination' })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Base64 encoded cursor of id and createdAt' })
    @ApiQuery({ name: 'limit', required: false, schema: { default: 20, maximum: 20 } })
    @ApiResponse({ status: 200, description: 'Returns a list of blogs and the next cursor' })
    async list(
        @Query('cursor') cursor?: string,
        @Query('limit') limit: number = 20
    ) {
        const safeLimit = Math.min(Number(limit) || 20, 20);

        let parsedCursor: { createdAt: Date; id: string } | undefined;

        // Decode the Base64 cursor if it exists
        if (cursor) {
            try {
                const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
                const { createdAt, id } = JSON.parse(decoded);
                parsedCursor = { createdAt: new Date(createdAt), id };
            } catch (e) {
                parsedCursor = undefined;
            }
        }

        const result = await this.blogsService.findAllCursor(parsedCursor, safeLimit);

        // Encode the nextCursor back to Base64 for the frontend
        const response = {
            ...result,
            nextCursor: result.nextCursor
                ? Buffer.from(JSON.stringify(result.nextCursor)).toString('base64')
                : null
        };

        return response;
    }

    @Get(':slug')
    @ApiOperation({ summary: 'Get a single blog by its slug' })
    @ApiResponse({ status: 200, description: 'Blog found' })
    @ApiResponse({ status: 404, description: 'Blog not found' })
    getBySlug(@Param('slug') slug: string) {
        return this.blogsService.findOneBySlug(slug);
    }

    @Post()
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create a new blog' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: CreateBlogDto })
    @UseInterceptors(FileInterceptor('image', imageUploadConfig('blogs')))
    async create(
        @UploadedFile() file: any,
        @Body() dto: CreateBlogDto
    ) {
        const path = file ? `uploads/images/blogs/${file.filename}` : '';
        return this.blogsService.create(dto, path);
    }

    @Put(':id')
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update an existing blog' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UpdateBlogDto })
    @ApiParam({ name: 'id', description: 'The UUID of the blog' })
    @ApiResponse({ status: 200, description: 'Blog updated successfully' })
    @ApiResponse({ status: 400, description: 'Slug already exists for another blog' })
    @ApiResponse({ status: 404, description: 'Blog not found' })
    @UseInterceptors(FileInterceptor('image', imageUploadConfig('blogs')))
    async update(
        @Param('id') id: string,
        @UploadedFile() file: any,
        @Body() dto: UpdateBlogDto,
    ) {
        // Only provide a path if a new image was actually uploaded
        const path = file ? `uploads/images/blogs/${file.filename}` : undefined;
        return this.blogsService.update(id, dto, path);
    }

    @Delete(':id')
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete a blog' })
    @ApiParam({ name: 'id', description: 'The UUID of the blog' })
    @ApiResponse({ status: 200, description: 'Blog deleted successfully' })
    @ApiResponse({ status: 404, description: 'Blog not found' })
    async remove(@Param('id') id: string) {
        return this.blogsService.remove(id);
    }
}