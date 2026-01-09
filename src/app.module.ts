import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CustomValidationPipe } from './common/pipes/customValidation.pipe';
import { UsersModule } from './modules/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './modules/auth/auth.controller';
import { AuthModule } from './modules/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from "ms";
import { SessionsModule } from './modules/sessions/sessions.module';
import { EmailModule } from './modules/email/email.module';
import { SettingsModule } from './modules/settings/settings.module';
import { CacheModule } from '@nestjs/cache-manager';
import { SeedModule } from './database/seeds/seed.module';
import { CompanyInfoModule } from './modules/companyInfo/companyInfo.module';
import { SwaggerSyncModule } from 'nestjs-swagger-sync';
import { DepartmentsModule } from './modules/departments/departments.module';
import { TeamsModule } from './modules/teams/teams.module';
import { ContactUsModule } from './modules/contactUsMessages/contactUs.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { CountriesModule } from './modules/countries/countries.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return ({
          type: 'postgres',
          host: config.get<string>('DATABASE_HOST', 'localhost'),
          port: parseInt(config.get('DATABASE_PORT', '5432'), 10),
          username: config.get<string>('DATABASE_USER', 'postgres'),
          password: config.get<string>('DATABASE_PASSWORD', ''),
          database: config.get<string>('DATABASE_NAME', 'qunuf'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          autoLoadEntities: true,
          synchronize: process.env.NODE_ENV === 'development',
          migrations: [__dirname + '/database/migration/**/*{.js,.ts}'],
          logging: 'all'
        })
      },
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET as string,
      signOptions: { expiresIn: process.env.JWT_EXPIRE as StringValue ?? '1d' },
    }),

    CacheModule.register({
      isGlobal: true,
    }),
    SwaggerSyncModule.register({
      apiKey: process.env.POSTMAN_API_KEY as string,
      swaggerPath: 'api/docs',
      baseUrl: 'http://localhost:8081',
      collectionName: "backend",
      runTest: false
    }),
    SeedModule,
    UsersModule,
    AuthModule,
    SessionsModule,
    EmailModule,
    SettingsModule,
    CompanyInfoModule,
    DepartmentsModule,
    TeamsModule,
    ContactUsModule,
    BlogsModule,
    CountriesModule,
    ConversationsModule,
    NotificationModule
  ],
  controllers: [AppController, AuthController],
  providers: [CustomValidationPipe],
})
export class AppModule { }
