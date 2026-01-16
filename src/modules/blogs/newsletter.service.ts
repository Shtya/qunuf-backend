// src/newsletter/newsletter.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Newsletter } from 'src/common/entities/newsletter.entity';
import { Repository } from 'typeorm';

@Injectable()
export class NewsletterService {
    constructor(
        @InjectRepository(Newsletter)
        private newsletterRepository: Repository<Newsletter>,
    ) { }

    async subscribe(email: string) {
        const existing = await this.newsletterRepository.findOne({ where: { email } });

        if (existing) {
            if (!existing.isActive) {
                existing.isActive = true;
                await this.newsletterRepository.save(existing);
                return { message: 'Welcome back! You have been resubscribed.' };
            }
            throw new BadRequestException('Email is already subscribed.');
        }

        const subscriber = this.newsletterRepository.create({ email });
        await this.newsletterRepository.save(subscriber);
        return { message: 'Subscribed successfully!' };
    }

    async getAllActiveEmails(): Promise<string[]> {
        const subscribers = await this.newsletterRepository.find({ where: { isActive: true } });
        return subscribers.map(sub => sub.email);
    }
}