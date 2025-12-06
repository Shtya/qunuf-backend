import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Settings } from 'src/common/entities/settings.entity';
import { Result } from 'src/common/utils/Result';
import { Repository } from 'typeorm';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(Settings)
        private readonly settingsRepo: Repository<Settings>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    readonly CACHE_KEY = 'app_settings';

    async getSettings() {
        let settings = await this.settingsRepo.findOne({ where: {} });

        if (!settings) {
            // Create default values if none exist
            settings = this.settingsRepo.create({
                privacyPolicy: null,
                termsOfService: null,
                platformPercent: 2.5,
                contactEmail: process.env.APP_CONTACT_EMAIL || null,
                address: null,
            });

            const saved = await this.settingsRepo.save(settings);

            // Save to cache
            await this.cacheManager.set(this.CACHE_KEY, saved);

            return Result.created(saved, 'Default settings created');
        }

        // Save to cache
        await this.cacheManager.set(this.CACHE_KEY, settings);
        return Result.ok(settings, 'Settings fetched successfully');
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
        return Result.ok(saved, 'Settings updated successfully');
    }
}
