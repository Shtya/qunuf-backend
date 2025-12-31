import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, ILike } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactUsMessage } from 'src/common/entities/contact_us_messages';

import { CreateContactUsDto } from './dto/create-contact-us-dto';


@Injectable()
export class ContactUsService {
    constructor(
        @InjectRepository(ContactUsMessage)
        private readonly repo: Repository<ContactUsMessage>,
    ) { }

    async create(dto: CreateContactUsDto) {
        const entity = this.repo.create(dto);
        const saved = await this.repo.save(entity);
        return saved;
    }

    async findAll(page = 1, limit = 15, search?: string) {
        const take = limit;
        const skip = (page - 1) * limit;

        const where = search
            ? [
                { name: ILike(`%${search}%`) },
                { email: ILike(`%${search}%`) },
                { phone: ILike(`%${search}%`) },
            ]
            : {};

        const [records, total] = await this.repo.findAndCount({
            where,
            take,
            skip,
            order: { created_at: 'DESC' },
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
        if (!item) throw new NotFoundException('Message not found');
        return item;
    }
}
