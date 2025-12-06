import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Department } from 'src/common/entities/department.entity';
import { Repository } from 'typeorm';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { deleteFile } from 'src/common/utils/file.util';

@Injectable()
export class DepartmentsService {
    constructor(
        @InjectRepository(Department)
        private readonly repo: Repository<Department>,
    ) { }

    async findAll(page: number, limit: number) {
        const take = limit ?? 15;
        const skip = (page - 1) * limit;

        const [records, total] = await this.repo.findAndCount({
            skip,
            take,
            order: { created_at: 'ASC' }, // optional
        });

        const totalPages = Math.ceil(total / limit);

        return {
            records,
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        };
    }

    async findOne(id: string) {
        const item = await this.repo.findOne({ where: { id } });
        if (!item) throw new NotFoundException('Department not found');
        return item;
    }

    async create(dto: CreateDepartmentDto, imagePath?: string) {
        const entity = this.repo.create({ ...dto, imagePath: imagePath ?? null });
        return this.repo.save(entity);
    }


    async update(id: string, dto: UpdateDepartmentDto, imagePath?: string) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Department not found');

        if (imagePath && existing.imagePath) {
            await deleteFile(existing.imagePath);
        }

        const merged = this.repo.merge(existing, { ...dto, ...(imagePath ? { imagePath } : {}) });
        return this.repo.save(merged);
    }

    async remove(id: string) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Department not found');
        if (existing.imagePath) await deleteFile(existing.imagePath);
        await this.repo.delete(id);
        return { deleted: true };
    }
}
