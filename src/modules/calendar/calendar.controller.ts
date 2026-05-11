import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CalendarFilterDto } from './dto/calendar-filter.dto';
import { SaveGoogleCredentialDto } from './dto/save-google-credential.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { UserRole } from 'src/common/entities/user.entity';

@ApiTags('Calendar')
@UseGuards(JwtAuthGuard)
@Controller('calendar')
export class CalendarController {
    constructor(private readonly calendarService: CalendarService) {}

    // ── Aggregated events ──────────────────────────────────────────────────────

    @Get('events')
    @ApiOperation({
        summary: 'Get all calendar events for the current user (contracts, payments, custom)',
    })
    @ApiResponse({ status: 200, description: 'Aggregated event list' })
    getEvents(@User() user: any, @Query() filter: CalendarFilterDto) {
        return this.calendarService.getAggregatedEvents(user.id, user.role as UserRole, filter);
    }

    // ── Custom event CRUD ──────────────────────────────────────────────────────

    @Post('events')
    @ApiOperation({ summary: 'Create a custom calendar event or reminder' })
    @ApiResponse({ status: 201, description: 'Event created' })
    create(@User() user: any, @Body() dto: CreateCalendarEventDto) {
        return this.calendarService.createCustomEvent(user.id, dto);
    }

    @Patch('events/:id')
    @ApiOperation({ summary: 'Update a custom calendar event (owner only)' })
    @ApiResponse({ status: 200, description: 'Event updated' })
    update(
        @User() user: any,
        @Param('id') id: string,
        @Body() dto: UpdateCalendarEventDto,
    ) {
        return this.calendarService.updateCustomEvent(user.id, id, dto);
    }

    @Delete('events/:id')
    @ApiOperation({ summary: 'Delete a custom calendar event (owner only)' })
    @ApiResponse({ status: 200, description: 'Event deleted' })
    remove(@User() user: any, @Param('id') id: string) {
        return this.calendarService.deleteCustomEvent(user.id, id);
    }

    // ── Google Calendar — per-user credentials ────────────────────────────────

    @Get('google/credentials')
    @ApiOperation({ summary: 'Get saved Google credentials for the current user (secret masked)' })
    getGoogleCredential(@User() user: any) {
        return this.calendarService.getGoogleCredential(user.id);
    }

    @Post('google/credentials')
    @ApiOperation({ summary: 'Save / update Google OAuth credentials for the current user' })
    saveGoogleCredential(@User() user: any, @Body() dto: SaveGoogleCredentialDto) {
        return this.calendarService.saveGoogleCredential(user.id, dto);
    }

    @Delete('google/credentials')
    @ApiOperation({ summary: 'Remove saved Google credentials for the current user' })
    deleteGoogleCredential(@User() user: any) {
        return this.calendarService.deleteGoogleCredential(user.id);
    }

    @Get('google/auth-url')
    @ApiOperation({ summary: 'Build Google OAuth consent URL using the user\'s saved credentials' })
    getGoogleAuthUrl(@User() user: any) {
        return this.calendarService.getGoogleAuthUrl(user.id);
    }
}
