
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
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CreateBlogDto, SubscribeDto } from "./dto/create-blog.dto";
import { imageUploadConfig } from "src/common/utils/file.util";
import { UpdateBlogDto } from "./dto/update-blog.dto";
import { Auth } from "src/common/decorators/auth.decorator";
import { UserRole } from "src/common/entities/user.entity";
import { decodeCursor, encodeCursor } from "src/common/utils/crud.util";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { User } from "src/common/decorators/user.decorator";
import { CRUD } from "src/common/services/crud.service";
import { NewsletterService } from "./newsletter.service";

@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController {
    constructor(
        private readonly blogsService: BlogsService,
        private readonly newsletterService: NewsletterService

    ) { }


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

        const parsedCursor = decodeCursor(cursor);

        const result = await this.blogsService.findAllCursor(parsedCursor, safeLimit);

        // Encode the nextCursor back to Base64 for the frontend
        const response = {
            ...result,
            nextCursor: encodeCursor(result.nextCursor)
        };

        return response;
    }

    @Get('recent')
    @ApiOperation({ summary: 'Get the most recent blog' })
    @ApiResponse({
        status: 200,
        description: 'Returns the most recent blog without descriptions',
    })
    async recent() {

        const blog = await this.blogsService.findMostRecent();


        return blog;
    }

    @Get('admin')
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all blogs with pagination' })
    @ApiResponse({ status: 200, description: 'List of blogs' })
    async getNotifications(
        @Query() query: PaginationDto,
        @User() user: any
    ) {
        return this.blogsService.findPagination(query)
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

        if (!file) {
            throw new BadRequestException('Image is required');
        }
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

    @Post('subscribe')
    async subscribe(@Body() body: SubscribeDto) {
        return this.newsletterService.subscribe(body.email);
    }
}