import { Body, Controller, Put, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBody, ApiNotFoundResponse, ApiOperation, ApiResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService
  ) { }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: UpdateUserDto })
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateProfile(@User() user: any, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto);
  }
}
