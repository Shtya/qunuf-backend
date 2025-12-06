import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TeamMember } from 'src/common/entities/team.entity';
import { Repository } from 'typeorm';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { deleteFile } from 'src/common/utils/file.util';
import { Result } from 'src/common/utils/Result';

@Injectable()
export class TeamsService {
    constructor(
        @InjectRepository(TeamMember)
        private readonly repo: Repository<TeamMember>,
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

        return Result.ok({ records, pagination }, 'Team members fetched successfully');
    }

    async findOne(id: string) {
        const item = await this.repo.findOne({ where: { id } });
        if (!item) return Result.notFound('Team member not found');
        return Result.ok(item, 'Team member fetched successfully');
    }

    async create(dto: CreateTeamDto, imagePath?: string) {
        const entity = this.repo.create({ ...dto, imagePath: imagePath ?? null });
        const saved = await this.repo.save(entity);
        return Result.created(saved, 'Team member created successfully');
    }

    async update(id: string, dto: UpdateTeamDto, imagePath?: string) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing) return Result.notFound('Team member not found');

        if (imagePath && existing.imagePath) {
            await deleteFile(existing.imagePath);
        }

        const merged = this.repo.merge(existing, { ...dto, ...(imagePath ? { imagePath } : {}) });
        const updated = await this.repo.save(merged);

        return Result.ok(updated, 'Team member updated successfully');
    }

    async remove(id: string) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing) return Result.notFound('Team member not found');

        if (existing.imagePath) await deleteFile(existing.imagePath);

        await this.repo.delete(id);
        return Result.ok(null, 'Team member deleted successfully');
    }
}
