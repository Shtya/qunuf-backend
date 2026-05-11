import { TypeOrmModule } from "@nestjs/typeorm";
import { CountriesController } from "./countries.controller";
import { CountriesService } from "./countries.service";
import { Module } from "@nestjs/common";
import { Country } from "src/common/entities/country.entity";
import { State } from "src/common/entities/state.entity";


@Module({
    imports: [TypeOrmModule.forFeature([Country, State])], // register the Country entity
    controllers: [CountriesController],
    providers: [CountriesService],
})
export class CountriesModule { }