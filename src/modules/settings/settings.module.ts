import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { Settings } from 'src/common/entities/settings.entity';
import { User } from 'src/common/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Settings, User])],
    providers: [SettingsService],
    controllers: [SettingsController],
    exports: [SettingsService],
})
export class SettingsModule { }
