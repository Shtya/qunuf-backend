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

    findAll() {
        return this.repo.find();
    }

    async findOne(id: string) {
        const item = await this.repo.findOne({ where: { id } });
        if (!item) throw new NotFoundException('Department not found');
        return item;
    }

    async create(dto: CreateDepartmentDto, imagePath: string) {
        const entity = this.repo.create({ ...dto, imagePath: imagePath });
        return this.repo.save(entity);
    }

    async update(id: string, dto: UpdateDepartmentDto, imagePath: string) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Department not found');

        // if imagePath provided and existing has image, delete old file
        if (imagePath && existing.imagePath) {
            await deleteFile(existing.imagePath);
        }

        const merged = this.repo.merge(existing, { ...dto, imagePath: imagePath ?? existing.imagePath });
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
