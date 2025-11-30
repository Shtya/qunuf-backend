import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { EmailService } from './email.service';
import { SettingsModule } from '../settings/settings.module';

@Global()
@Module({
    imports: [
        MailerModule.forRootAsync({
            useFactory: () => ({
                transport: {
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT) ?? 587,       // 465 or 587
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                },
                defaults: {
                    from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
                },
                template: {
                    dir: __dirname + '/../../email-templates',
                    adapter: new PugAdapter(),
                    options: { strict: true },
                },
            }),
        }),
        SettingsModule,
    ],
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule { }
