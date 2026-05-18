import { Inject, Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Settings } from 'src/common/entities/settings.entity';
import { Blog } from 'src/common/entities/blog.entity';
import { Contract } from 'src/common/entities/contract.entity';
import { Resend } from 'resend';
import * as pug from 'pug';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class EmailService {
    private readonly resend: Resend;

    constructor(
        private readonly settingsService: SettingsService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
        this.resend = new Resend(process.env.SMTP_PASS);
    }

    private async getAppSettings() {
        let settings = await this.cacheManager.get<Settings>(this.settingsService.CACHE_KEY);
        if (!settings) {
            settings = await this.settingsService.getSettings();
        }
        return settings;
    }

    private async sendMail(
        to: string | string[],
        subject: string,
        template: string,
        context: any,
        bcc?: string[],
    ) {
        const settings = await this.getAppSettings();

        const from = settings.contactEmail || process.env.SMTP_FROM || process.env.EMAIL_FROM;
        const appName = settings.name || process.env.APP_NAME;

        const fullContext = {
            appName,
            appContactEmail: settings.contactEmail || process.env.APP_CONTACT_EMAIL,
            appContactPhone: settings.contactPhone || process.env.APP_CONTACT_PHONE,
            appAddress: settings.address || process.env.APP_CONTACT_ADDRESS,
            ...context,
        };

        const templatePath = path.join(__dirname, '..', '..', 'email-templates', `${template}.pug`);
        const html = pug.renderFile(templatePath, fullContext);

        await this.resend.emails.send({
            from: `${appName} <${from}>`,
            to: Array.isArray(to) ? to : [to],
            bcc,
            subject,
            html,
        });
    }

    async sendNewBlogNotification(subscribers: string[], blog: Blog) {
        if (!subscribers.length) return;

        const settings = await this.getAppSettings();
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        const description = blog.description_en
            ? blog.description_en.substring(0, 150)
            : 'Check out our latest article on our platform.';

        let blogImageUrl: string | null = null;
        try {
            const imageAbsolutePath = path.join(process.cwd(), blog.imagePath.replace(/^\/+/, ''));
            const imageBuffer = fs.readFileSync(imageAbsolutePath);
            const ext = path.extname(imageAbsolutePath).slice(1) || 'png';
            blogImageUrl = `data:image/${ext};base64,${imageBuffer.toString('base64')}`;
        } catch (err) {
            console.warn('[Email] Could not embed blog image:', err?.message);
        }

        return this.sendMail(
            settings.contactEmail || 'no-reply@example.com',
            `New Post: ${blog.title_en}`,
            'new-blog',
            {
                blogTitle: blog.title_en,
                blogDescription: description,
                blogLink: `${frontendUrl}/blogs/${blog.slug}`,
                blogImageUrl,
            },
            subscribers,
        );
    }

    async sendVerificationEmail(to: string, verificationLink: string) {
        return this.sendMail(to, 'Verify your account', 'verification', { verificationLink });
    }

    async sendResetPasswordEmail(to: string, resetLink: string) {
        return this.sendMail(to, 'Reset your password', 'reset-password', { resetLink });
    }

    async sendPasswordChangedEmail(to: string) {
        return this.sendMail(to, 'Security Update: Password Reset Successfully', 'password-changed', {});
    }

    async sendEmailChangeConfirmation(newEmail: string, name: string, userId: string, code: string) {
        const confirmLink =
            `${process.env.BACKEND_URL}/api/v1/auth/confirm-email-change` +
            `?userId=${userId}&pendingEmail=${encodeURIComponent(newEmail)}&code=${code}`;

        return this.sendMail(newEmail, 'Confirm your email change', 'confirm-email-change', {
            name,
            confirmLink,
        });
    }

    async sendEmailChangeNotification(oldEmail: string, name: string) {
        return this.sendMail(oldEmail, 'Your email has been changed', 'email-changed-notification', { name });
    }

    async sendPasswordChangeNotification(email: string, name: string) {
        return this.sendMail(email, 'Security Update: Password Changed', 'password-changed-notification', { name });
    }

    async sendContractNotification(
        tenantEmail: string,
        contract: Contract,
        reviews: any[],
        averageRating: number | null = null,
    ) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        const formattedReviews = reviews.map(review => ({
            reviewerName: review.reviewerName,
            rate: review.rate,
            timeFormatted: this.formatReviewTime(review.time),
            text: review.text,
        }));

        const propertyName = contract.propertySnapshot?.name || 'Property';
        const propertyType = contract.propertySnapshot?.type || 'Unknown';
        const propertyLocation = contract.propertySnapshot?.stateName || 'Unknown';

        const finalAverageRating =
            averageRating !== null && averageRating !== undefined
                ? averageRating
                : reviews.length > 0
                    ? reviews.reduce((sum, r) => sum + r.rate, 0) / reviews.length
                    : null;

        const averageRatingFormatted =
            finalAverageRating !== null ? Number(finalAverageRating).toFixed(1) : null;

        const contractLink = `${frontendUrl}/dashboard/contracts?view=${contract.id}`;

        return this.sendMail(
            tenantEmail,
            `Contract Created: ${propertyName}`,
            'new-contract',
            {
                propertyName,
                propertyType,
                propertyLocation,
                averageRating: finalAverageRating,
                averageRatingFormatted,
                reviews: formattedReviews,
                contractLink,
            },
        );
    }

    private formatReviewTime(date: Date | string): string {
        if (!date) return 'Recently';

        const reviewDate = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
        return `${Math.floor(diffInDays / 365)} years ago`;
    }
}
