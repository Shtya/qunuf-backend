import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamMember } from 'src/common/entities/team.entity';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';

@Module({
    imports: [TypeOrmModule.forFeature([TeamMember])],
    providers: [TeamsService],
    controllers: [TeamsController],
    exports: [TeamsService],
})
export class TeamsModule { }
