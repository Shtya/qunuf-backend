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

        return { records, pagination };
    }

    async findOne(id: string) {
        const item = await this.repo.findOne({ where: { id } });
        if (!item) throw new NotFoundException('Team member not found');
        return item;
    }

    async create(dto: CreateTeamDto, imagePath?: string) {
        const entity = this.repo.create({ ...dto, imagePath: imagePath ?? null });
        const saved = await this.repo.save(entity);
        return saved;
    }

    async update(id: string, dto: UpdateTeamDto, imagePath?: string) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Team member not found');

        Object.assign(existing, dto);

        if (imagePath) {
            await deleteFile(existing.imagePath);
            existing.imagePath = imagePath;
        }
        // 4. Save and return
        return await this.repo.save(existing);
    }

    async remove(id: string) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Team member not found');

        if (existing.imagePath) await deleteFile(existing.imagePath);

        await this.repo.delete(id);
        return null;
    }
}
