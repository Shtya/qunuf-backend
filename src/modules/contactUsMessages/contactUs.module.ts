import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactUsMessage } from 'src/common/entities/contact_us_messages';
import { ContactUsController } from './contactUs.controller';
import { ContactUsService } from './contactUs.service';

@Module({
    imports: [TypeOrmModule.forFeature([ContactUsMessage])],
    providers: [ContactUsService],
    controllers: [ContactUsController],
    exports: [ContactUsService],
})
export class ContactUsModule { }
