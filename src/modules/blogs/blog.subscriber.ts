// src/blogs/blog.subscriber.ts
import {
    EventSubscriber,
    EntitySubscriberInterface,
    InsertEvent,
    DataSource,
} from 'typeorm';
import { EmailService } from '../email/email.service';
import { Injectable } from '@nestjs/common';
import { Blog } from 'src/common/entities/blog.entity';
import { NewsletterService } from './newsletter.service';

@Injectable()
@EventSubscriber()
export class BlogSubscriber implements EntitySubscriberInterface<Blog> {
    constructor(
        dataSource: DataSource,
        private readonly newsletterService: NewsletterService,
        private readonly emailService: EmailService,
    ) {
        dataSource.subscribers.push(this);
    }

    listenTo() {
        return Blog;
    }

    async afterInsert(event: InsertEvent<Blog>) {
        const blog = event.entity;


        const recipients = await this.newsletterService.getAllActiveEmails();

        if (recipients.length === 0) return;

        console.log(`[BlogSubscriber] New blog "${blog.title_ar}" created. Sending to ${recipients.length} subscribers.`);

        const BATCH_SIZE = 50;

        this.processEmailBatches(recipients, blog, BATCH_SIZE);
    }

    private async processEmailBatches(recipients: string[], blog: Blog, batchSize: number) {
        try {
            for (let i = 0; i < recipients.length; i += batchSize) {
                const batch = recipients.slice(i, i + batchSize);

                await this.emailService.sendNewBlogNotification(batch, blog);

                console.log(`[BlogSubscriber] Batch ${i / batchSize + 1} sent successfully.`);
            }
        } catch (error) {
            console.error('[BlogSubscriber] Error sending notification emails:', error);
        }
    }
}