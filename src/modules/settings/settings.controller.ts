import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Settings } from 'src/common/entities/settings.entity';
import { UserRole } from 'src/common/entities/user.entity';
import { Auth } from 'src/common/decorators/auth.decorator';


@Controller('settings')
@Auth(UserRole.ADMIN)
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get()
    async getSettings(): Promise<Settings> {
        return this.settingsService.getSettings();
    }

    @Put()
    async updateSettings(@Body() updateDto: Partial<Settings>): Promise<Settings> {
        return this.settingsService.updateSettings(updateDto);
    }
}
