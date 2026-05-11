import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { EmailService } from './email.service';
import { SettingsModule } from '../settings/settings.module';

@Global()
@Module({
    imports: [
        MailerModule.forRootAsync({
            useFactory: () => {
                const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
                const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
                const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_FROM || emailUser;
                const port = Number(process.env.SMTP_PORT || 587);
                const rejectUnauthorized =
                    process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== undefined
                        ? process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false'
                        : process.env.NODE_ENV === 'production';
                const useGmailService = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

                return {
                    transport: useGmailService
                        ? {
                            service: 'gmail',
                            auth: {
                                user: emailUser,
                                pass: emailPass,
                            },
                            tls: {
                                rejectUnauthorized,
                            },
                        }
                        : {
                            host: process.env.SMTP_HOST,
                            port,
                            secure: port === 465,
                            auth: {
                                user: emailUser,
                                pass: emailPass,
                            },
                            tls: {
                                rejectUnauthorized,
                            },
                        },
                    defaults: {
                        from: `"${process.env.APP_NAME}" <${fromEmail}>`,
                    },
                    template: {
                        dir: __dirname + '/../../email-templates',
                        adapter: new PugAdapter(),
                        options: { strict: true },
                    },
                };
            },
        }),
        SettingsModule,
    ],
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule { }
