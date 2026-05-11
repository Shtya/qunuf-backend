import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { CalendarEvent } from 'src/common/entities/calendar_event.entity';
import { UserGoogleCredential } from 'src/common/entities/user_google_credential.entity';
import { Contract } from 'src/common/entities/contract.entity';
import { RenewRequest } from 'src/common/entities/renew_request';

@Module({
    imports: [
        TypeOrmModule.forFeature([CalendarEvent, UserGoogleCredential, Contract, RenewRequest]),
    ],
    controllers: [CalendarController],
    providers: [CalendarService],
    exports: [CalendarService],
})
export class CalendarModule {}
