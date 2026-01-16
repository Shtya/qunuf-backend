import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from 'src/common/entities/blog.entity';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { Newsletter } from 'src/common/entities/newsletter.entity';
import { NewsletterService } from './newsletter.service';
import { EmailService } from '../email/email.service';
import { BlogSubscriber } from './blog.subscriber';
import { Settings } from 'src/common/entities/settings.entity';
import { SettingsService } from '../settings/settings.service';
import { SettingsModule } from '../settings/settings.module';
import { EmailModule } from '../email/email.module';


@Module({
    imports: [TypeOrmModule.forFeature([Blog, Newsletter, SettingsModule, EmailModule])],
    providers: [BlogsService, BlogSubscriber, NewsletterService],
    controllers: [BlogsController],
})
export class BlogsModule { }
