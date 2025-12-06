import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ContactUsService } from './contactUs.service';
import { CreateContactUsDto } from './create-contact-us-dto';

@ApiTags('Contact Us')
@Controller('contact-us')
export class ContactUsController {
    constructor(private readonly svc: ContactUsService) { }

    @Post()
    create(@Body() dto: CreateContactUsDto) {
        return this.svc.create(dto);
    }

    @Get()
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
    get(@Param('id') id: string) {
        return this.svc.findOne(id);
    }
}
