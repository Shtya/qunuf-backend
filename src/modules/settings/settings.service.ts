import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Settings } from 'src/common/entities/settings.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(Settings)
        private readonly settingsRepo: Repository<Settings>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) { }

    readonly CACHE_KEY = 'app_settings';

    async getSettings(): Promise<Settings> {
        let settings = await this.settingsRepo.findOne({ where: {} });
        if (!settings) {
            // create default values if none exist
            settings = this.settingsRepo.create({
                vision: null,
                goals: null,
                missions: null,
                privacyPolicy: null,
                termsOfService: null,
                platformPercent: 2.5,
                contactEmail: process.env.APP_CONTACT_EMAI,
                address: null,
            });
            await this.settingsRepo.save(settings);
        }


        // Save to cache
        await this.cacheManager.set(this.CACHE_KEY, settings);
        return settings;
    }

    async updateSettings(updateDto: Partial<Settings>): Promise<Settings> {
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
