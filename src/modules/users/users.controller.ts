import { Body, Controller, Post, Put, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { UpdateUserProfileDto } from './dto/update-user.dto';
import { ApiBody, ApiNotFoundResponse, ApiOperation, ApiResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { imageUploadConfig } from 'src/common/utils/file.util';
import { FileInterceptor } from '@nestjs/platform-express';

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
}
