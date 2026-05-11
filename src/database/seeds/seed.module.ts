import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { State } from 'src/common/entities/state.entity';
import { CompanyInfo } from 'src/common/entities/companyInfo.entity';
import { Department } from 'src/common/entities/department.entity';
import { TeamMember } from 'src/common/entities/team.entity';



@Module({
    imports: [
        TypeOrmModule.forFeature([
            State,
            CompanyInfo,
            Department,
            TeamMember
        ]),
    ],
    providers: [SeedService],
    exports: [SeedService],
})
export class SeedModule { }
