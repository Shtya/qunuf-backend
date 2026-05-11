import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateContactUsDto } from './dto/create-contact-us-dto';
import { ContactUsService } from './contactUs.service';
import { Auth } from 'src/common/decorators/auth.decorator';
import { UserRole } from 'src/common/entities/user.entity';

@ApiTags('Contact Us')
@Controller('contact-us')
export class ContactUsController {
    constructor(private readonly svc: ContactUsService) { }

    @Post()
    @ApiOperation({ summary: 'Submit a contact us message' })
    @ApiResponse({ status: 201, description: 'Message submitted successfully' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    create(@Body() dto: CreateContactUsDto) {
        return this.svc.create(dto);
    }

    @Get()
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'List all contact messages with pagination & search' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Messages fetched successfully' })
    list(
        @Query('page') page = 1,
        @Query('limit') limit = 15,
        @Query('search') search?: string,
    ) {
        page = Number(page);
        limit = Number(limit);
        return this.svc.findAll(page, limit, search);
    }

    @Get(':id')
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get a single contact message by ID' })
    @ApiParam({ name: 'id', type: 'string' })
    @ApiResponse({ status: 200, description: 'Message fetched successfully' })
    @ApiResponse({ status: 404, description: 'Message not found' })
    get(@Param('id') id: string) {
        return this.svc.findOne(id);
    }
}
