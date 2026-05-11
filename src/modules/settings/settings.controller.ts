import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Settings } from 'src/common/entities/settings.entity';
import { UserRole } from 'src/common/entities/user.entity';
import { Auth } from 'src/common/decorators/auth.decorator';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateSettingsDto } from './dto/settings.dto';


@ApiTags('Settings') // Organizes endpoints under "Settings" in Swagger UI
@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get()
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get full settings (Admin only)' })
    @ApiResponse({ status: 200, description: 'Returns all settings including secret fields.' })
    async getSettings() {
        return this.settingsService.getSettings();
    }

    @Get('public')
    @ApiOperation({ summary: 'Get public settings' })
    @ApiResponse({ status: 200, description: 'Returns settings excluding sensitive data like platform percent.' })
    async getPublicSettings() {
        return this.settingsService.getPublicSettings();
    }

    @Put()
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update settings (Admin only)' })
    @ApiBody({ type: UpdateSettingsDto, description: 'Partial settings object' }) // Use a specific DTO here if possible
    @ApiResponse({ status: 200, description: 'Settings updated successfully.' })
    async updateSettings(@Body() updateDto: Partial<UpdateSettingsDto>) {
        return this.settingsService.updateSettings(updateDto);
    }
}