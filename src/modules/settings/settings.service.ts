import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Settings } from 'src/common/entities/settings.entity';
import { User, UserRole } from 'src/common/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(Settings)
        private readonly settingsRepo: Repository<Settings>,

        @InjectRepository(User)
        private userRepository: Repository<User>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    readonly CACHE_KEY = 'app_settings';

    async getSettings() {
        let settings = await this.settingsRepo.findOne({ where: {} });

        if (!settings) {
            // Create default values if none exist
            settings = this.settingsRepo.create({
                platformPercent: 2.5,
                contactEmail: process.env.APP_CONTACT_EMAIL || null
            });

            const saved = await this.settingsRepo.save(settings);

            // Save to cache
            await this.cacheManager.set(this.CACHE_KEY, saved);

            return saved;
        }

        // Save to cache
        await this.cacheManager.set(this.CACHE_KEY, settings);
        return settings;
    }

    async getPublicSettings() {
        const [settings, adminUser] = await Promise.all([
            this.getSettings(),
            this.userRepository.findOne({
                where: { role: UserRole.ADMIN },
                order: { id: 'ASC' }, // ensures first one
                select: ['id'],
            }),
        ]);

        return {
            ...settings,
            adminUserId: adminUser?.id || null,
        };
    }


    async updateSettings(updateDto: Partial<Settings>) {
        let settings = await this.settingsRepo.findOne({ where: {} });

        if (!settings) {
            settings = this.settingsRepo.create(updateDto);
        } else {
            Object.assign(settings, updateDto);
        }

        const saved = await this.settingsRepo.save(settings);

        await this.cacheManager.set(this.CACHE_KEY, saved);
        return saved;
    }
}
