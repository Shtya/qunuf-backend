import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Blog } from "src/common/entities/blog.entity";
import { Not, Repository } from "typeorm";
import { CreateBlogDto } from "./dto/create-blog.dto";
import { UpdateBlogDto } from "./dto/update-blog.dto";
import { deleteFile } from "src/common/utils/file.util";
import { CRUD } from "src/common/services/crud.service";


@Injectable()
export class BlogsService {
    constructor(
        @InjectRepository(Blog)
        private readonly blogRepo: Repository<Blog>,
    ) { }

    // blogs.service.ts

    private generateSlugHelper(title: string): string {
        // 1. Create the base slug using your logic
        const baseSlug = title
            .toLowerCase()
            .trim()
            .replace(/[^\p{L}\p{N}\s-]/gu, '') // Unicode support
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');

        return baseSlug;
    }

    async findAllCursor(cursor?: { createdAt: Date; id: string }, limit: number = 20) {
        const queryBuilder = this.blogRepo.createQueryBuilder('blog');

        return CRUD.paginateCursor(queryBuilder, 'blog', cursor, limit);
    }

    async create(dto: CreateBlogDto, imagePath: string): Promise<Blog> {
        const slug = this.generateSlugHelper(dto.title);

        const existing = await this.blogRepo.findOne({ where: { slug } });
        if (existing) {
            throw new BadRequestException(`Blog with title "${dto.title}" already exists`)
        }
        const blog = this.blogRepo.create({ ...dto, imagePath: imagePath });
        return await this.blogRepo.save(blog);
    }

    async findOneBySlug(slug: string): Promise<Blog> {
        const blog = await this.blogRepo.findOne({ where: { slug } });
        if (!blog) throw new NotFoundException(`Blog with slug "${slug}" not found`);
        return blog;
    }

    async update(id: string, dto: UpdateBlogDto, imagePath?: string): Promise<Blog> {
        // 1. Check if the blog exists first
        const blog = await this.blogRepo.findOne({ where: { id } });
        if (!blog) {
            throw new NotFoundException(`Blog not found`);
        }

        // 2. Handle slug logic if title is being updated
        let newSlug = blog.slug;
        if (dto.title && dto.title !== blog.title) {
            newSlug = this.generateSlugHelper(dto.title); // Your regex helper

            // Check if this slug is already taken by ANOTHER blog
            const slugExists = await this.blogRepo.findOne({
                where: { slug: newSlug, id: Not(id) }
            });

            if (slugExists) {
                throw new BadRequestException(`A blog with the title "${dto.title}" already exists.`);
            }
        }

        Object.assign(blog, dto);
        if (imagePath) {
            await deleteFile(blog.imagePath);
            blog.imagePath = imagePath;
        }
        // 4. Save and return
        return await this.blogRepo.save(blog);
    }

    async remove(id: string): Promise<{ deleted: boolean }> {
        const existing = await this.blogRepo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Blog not found');

        if (existing.imagePath) await deleteFile(existing.imagePath);

        await this.blogRepo.delete(id);

        return { deleted: true };
    }

}
