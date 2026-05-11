import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { UpdateUserProfileDto } from './dto/update-user.dto';
import { ApiBody, ApiNotFoundResponse, ApiOperation, ApiResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { imageUploadConfig } from 'src/common/utils/file.util';
import { FileInterceptor } from '@nestjs/platform-express';
import { Auth } from 'src/common/decorators/auth.decorator';
import { UserRole, UserStatus } from 'src/common/entities/user.entity';
import { UserFilterDto, UserExportFilterDto } from './dto/user-filter.dto';
import { Response } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService
  ) { }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: UpdateUserProfileDto })
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateProfile(@User() user: any, @Body() dto: UpdateUserProfileDto) {
    return this.usersService.update(user.id, dto);
  }


  @Post('profile-image')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user image' })
  @ApiResponse({ status: 200, description: 'Image updated successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseInterceptors(FileInterceptor('image', imageUploadConfig('users')))
  async updateProfileImage(@User() user: any, @UploadedFile() file: any) {
    let path = '';
    if (file) {
      path = `uploads/images/users/${file.filename}`;
    }

    return this.usersService.updateImage(user.id, path);
  }

  // --- ADMIN ONLY ENDPOINTS ---
  @Get('all')
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get paginated users with filters' })
  async findAll(
    @User() user: any,
    @Query() query: UserFilterDto,
  ) {
    return this.usersService.findAll(user, query);
  }

  @Get(':id/full-details')
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get full user details' })
  async getFullDetails(
    @Param('id') id: string
  ) {
    return this.usersService.findOneFull(id);
  }

  @Patch(':id/status')
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Update user status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: UserStatus,
  ) {
    return this.usersService.updateStatus(id, status);
  }

  @Get('export')
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Export users to Excel' })
  async export(
    @User() user: any,
    @Query() query: UserExportFilterDto,
    @Res() res: Response
  ) {
    const buffer = await this.usersService.exportUsers(user, query);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=users_export_${Date.now()}.xlsx`);

    return res.send(buffer);
  }
}
