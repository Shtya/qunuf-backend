import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { State } from 'src/common/entities/state.entity';
import { PropertyType } from 'src/common/entities/property-type.entity';
import { PropertySubtype } from 'src/common/entities/property-subtype.entity';



@Module({
    imports: [
        TypeOrmModule.forFeature([
            State,
            PropertyType,
            PropertySubtype,
        ]),
    ],
    providers: [SeedService],
    exports: [SeedService],
})
export class SeedModule { }
