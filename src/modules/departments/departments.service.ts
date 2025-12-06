import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Department } from 'src/common/entities/department.entity';
import { Repository } from 'typeorm';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { deleteFile } from 'src/common/utils/file.util';
import { Result } from 'src/common/utils/Result';


@Injectable()
export class DepartmentsService {
    constructor(
        @InjectRepository(Department)
        private readonly repo: Repository<Department>,
    ) { }

    async findAll(page = 1, limit = 15) {
        const take = limit;
        const skip = (page - 1) * limit;

        const [records, total] = await this.repo.findAndCount({
            skip,
            take,
            order: { created_at: 'ASC' },
        });

        const pagination = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };

        return Result.ok({ records, pagination }, 'Departments fetched successfully');
    }

    async findOne(id: string) {
        const item = await this.repo.findOne({ where: { id } });
        if (!item) return Result.notFound('Department not found');
        return Result.ok(item, 'Department fetched successfully');
    }

    async create(dto: CreateDepartmentDto, imagePath?: string) {
        const entity = this.repo.create({ ...dto, imagePath: imagePath ?? null });
        const saved = await this.repo.save(entity);
        return Result.created(saved, 'Department created successfully');
    }

    async update(id: string, dto: UpdateDepartmentDto, imagePath?: string) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing) return Result.notFound('Department not found');

        // Delete old image if a new one is uploaded
        if (imagePath && existing.imagePath) {
            await deleteFile(existing.imagePath);
        }

        const merged = this.repo.merge(existing, { ...dto, ...(imagePath ? { imagePath } : {}) });
        const updated = await this.repo.save(merged);

        return Result.ok(updated, 'Department updated successfully');
    }

    async remove(id: string) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing) return Result.notFound('Department not found');

        if (existing.imagePath) await deleteFile(existing.imagePath);

        await this.repo.delete(id);
        return Result.ok(null, 'Department deleted successfully');
    }
}
