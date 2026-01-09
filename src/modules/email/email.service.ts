// email.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SettingsService } from '../settings/settings.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Settings } from 'src/common/entities/settings.entity';

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
            settings = await this.settingsService.getSettings();
        }

        return settings
    }


    private async sendMail(to: string, subject: string, template: string, context: any) {
        const settings = await this.getAppSettings();



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

    async sendEmailChangeConfirmation(
        newEmail: string,
        name: string,
        userId: string,
        code: string,
    ) {

        const confirmLink =
            `${process.env.BACKEND_URL}/api/v1/auth/confirm-email-change` +
            `?userId=${userId}&pendingEmail=${encodeURIComponent(newEmail)}&code=${code}`;

        return this.sendMail(newEmail, `Confirm your email change`, 'confirm-email-change', {
            name,
            confirmLink,
        }
        );
    }

    async sendEmailChangeNotification(
        oldEmail: string,
        name: string,
    ) {

        return this.sendMail(oldEmail, `Your email has been changed`, 'email-changed-notification', {
            name,
        });
    }

    async sendPasswordChangeNotification(
        email: string,
        name: string,
    ) {

        await this.sendMail(email, `Password Changed`, 'password-changed-notification', {
            name,
        });
    }

}
