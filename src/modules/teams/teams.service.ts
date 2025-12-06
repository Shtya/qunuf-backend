import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TeamMember } from 'src/common/entities/team.entity';
import { Repository } from 'typeorm';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { deleteFile } from 'src/common/utils/file.util';

@Injectable()
export class TeamsService {
    constructor(
        @InjectRepository(TeamMember)
        private readonly repo: Repository<TeamMember>,
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
        if (!item) throw new NotFoundException('Team member not found');
        return item;
    }

    async create(dto: CreateTeamDto, imagePath?: string) {
        const entity = this.repo.create({ ...dto, imagePath: imagePath ?? null });
        return this.repo.save(entity);
    }

    async update(id: string, dto: UpdateTeamDto, imagePath?: string) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Team member not found');

        if (imagePath && existing.imagePath) {
            await deleteFile(existing.imagePath);
        }

        const merged = this.repo.merge(existing, { ...dto, ...(imagePath ? { imagePath } : {}) });
        return this.repo.save(merged);
    }

    async remove(id: string) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Team member not found');
        if (existing.imagePath) await deleteFile(existing.imagePath);
        await this.repo.delete(id);
        return { deleted: true };
    }
}
