import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Auth } from 'src/common/decorators/auth.decorator';
import { UserRole } from 'src/common/entities/user.entity';
import { EmailService } from '../email/email.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService,
    private readonly emailService: EmailService
  ) { }

}
