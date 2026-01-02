import { Controller, Get, Put, UseGuards, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CRUD } from 'src/common/services/crud.service';
import { User } from 'src/common/decorators/user.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) { }

  @Get()
  @ApiOperation({ summary: 'Get all notifications with pagination' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  async getNotifications(
    @Query() query: PaginationDto,
    @User() user: any
  ) {
    return CRUD.findAll(
      this.notificationService.notificationRepository,
      'notification',
      '',
      query.page,
      query.limit,
      query.sortBy,
      query.sortOrder,
      [], // relations
      [], // search fields
      { userId: user.id }, // filter
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread notification count' })
  @ApiResponse({ status: 200, description: 'The count is fetched directly from the User entity for performance' })
  async getUnreadCount(@User() user: any) {
    return this.notificationService.getUnreadCount(user.id);
  }

  @Put('read/:id')
  @ApiOperation({ summary: 'Mark a specific notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsRead(
    @User() user: any,
    @Param('id') notificationId: string
  ) {
    return this.notificationService.markAsRead(user.id, notificationId);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications for the current user as read' })
  async markAllAsRead(@User() user: any) {
    return this.notificationService.markAllAsRead(user.id);
  }
}