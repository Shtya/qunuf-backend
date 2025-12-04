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

    findAll() {
        return this.repo.find();
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

        const merged = this.repo.merge(existing, { ...dto, imagePath: imagePath ?? existing.imagePath });
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
