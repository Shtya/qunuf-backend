// email.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SettingsService } from '../settings/settings.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Settings } from 'src/common/entities/settings.entity';
import { Blog } from 'src/common/entities/blog.entity';
import { Contract } from 'src/common/entities/contract.entity';
import path from 'path';

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


    private async sendMail(to: string | string[], subject: string, template: string, context: any, bcc?: string[], attachments?: any[]) {
        const settings = await this.getAppSettings();



        return this.mailerService.sendMail({
            to,
            bcc,
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
            attachments,
        });
    }

    async sendNewBlogNotification(subscribers: string[], blog: Blog) {
        if (!subscribers.length) return;

        const settings = await this.getAppSettings();
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8081';

        // 
        const description = blog.description_en
            ? blog.description_en.substring(0, 150)
            : 'Check out our latest article on our platform.';

        const imageAbsolutePath = path.join(process.cwd(), blog.imagePath.replace(/^\/+/, ''));
        console.log('Attaching image from:', imageAbsolutePath);
        return this.sendMail(
            settings.contactEmail || 'no-reply@example.com',
            `New Post: ${blog.title_en}`,
            'new-blog',
            {
                blogTitle: blog.title_en,
                blogDescription: description,
                blogLink: `${frontendUrl}/blogs/${blog.slug}`,
                blogImageCid: 'blogImage'
            },
            subscribers,
            [
                {
                    filename: 'blog-image.png',
                    path: imageAbsolutePath,
                    cid: 'blogImage' // This must match the variable used in context
                }
            ]
        );
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
        return this.sendMail(to, 'Security Update: Password Reset Successfully', 'password-changed', {
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

        await this.sendMail(email, `Security Update: Password Changed`, 'password-changed-notification', {
            name,
        });
    }

    async sendContractNotification(
        tenantEmail: string,
        contract: Contract,
        reviews: any[],
        averageRating: number | null = null
    ) {
        const settings = await this.getAppSettings();
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        // Format reviews with time
        const formattedReviews = reviews.map(review => ({
            reviewerName: review.reviewerName,
            rate: review.rate,
            timeFormatted: this.formatReviewTime(review.time),
            text: review.text,
        }));

        // Get property information from snapshot
        const propertyName = contract.propertySnapshot?.name || 'Property';
        const propertyType = contract.propertySnapshot?.type || 'Unknown';
        const propertyLocation = contract.propertySnapshot?.stateName || 'Unknown';

        // Use provided averageRating or calculate from reviews if not provided
        const finalAverageRating = averageRating !== null && averageRating !== undefined
            ? averageRating
            : (reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rate, 0) / reviews.length
                : null);

        // Format average rating as string to avoid template errors
        const averageRatingFormatted = finalAverageRating !== null && finalAverageRating !== undefined
            ? Number(finalAverageRating).toFixed(1)
            : null;

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
            }
        );
    }

    private formatReviewTime(date: Date | string): string {
        if (!date) return 'Recently';

        const reviewDate = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diffInMs = now.getTime() - reviewDate.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
        return `${Math.floor(diffInDays / 365)} years ago`;
    }


}
