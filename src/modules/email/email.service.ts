// email.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SettingsService } from '../settings/settings.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Settings } from 'src/common/entities/settings.entity';
import { Result } from 'src/common/utils/Result';

@Injectable()
export class EmailService {
    constructor(
        private readonly mailerService: MailerService,
        private readonly settingsService: SettingsService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    private async getAppSettings() {
        // Try cache first
        let settings = await this.cacheManager.get<Settings>(this.settingsService.CACHE_KEY);

        if (!settings) {
            const result = await this.settingsService.getSettings();

            // If your service already returns Result, use it
            if (!result.isOk) {
                return result;
            }

            settings = result.data as Settings;
        }

        return Result.ok(settings, 'App settings fetched successfully');
    }


    private async sendMail(to: string, subject: string, template: string, context: any) {
        const result = await this.getAppSettings();

        if (!result.isOk) {
            return result;
        }

        let settings = result.data as Settings;

        return this.mailerService.sendMail({
            to,
            from: settings.contactEmail || process.env.SMTP_FROM,
            subject,
            template,
            context: {
                appName: settings.name || process.env.APP_NAME,
                appContactEmail: settings.contactEmail || process.env.APP_CONTACT_EMAIL,
                appContactPhone: settings.contactPhone || process.env.APP_CONTACT_PHONE,
                appAddress: settings.address || process.env.APP_CONTACT_ADDRESS,
                ...context,
            },
        });
    }

    async sendVerificationEmail(to: string, verificationLink: string) {
        return this.sendMail(to, 'Verify your account', 'verification', {
            verificationLink,
        });
    }

    async sendResetPasswordEmail(to: string, resetLink: string) {
        return this.sendMail(to, 'Reset your password', 'reset-password', {
            resetLink,
        });
    }

    async sendPasswordChangedEmail(to: string) {
        return this.sendMail(to, 'Your password was changed', 'password-changed', {
            // any context needed by template
        });
    }
}
