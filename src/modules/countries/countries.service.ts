import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Country } from "src/common/entities/country.entity";
import { State } from "src/common/entities/state.entity";
import { Repository } from "typeorm";

@Injectable()
export class CountriesService {
    constructor(
        @InjectRepository(Country)
        private readonly countriesRepository: Repository<Country>,

        @InjectRepository(State)
        private readonly statesRepository: Repository<State>,
    ) { }

    async findAll(): Promise<Country[]> {
        return this.countriesRepository.find();
    }

    async findAllStates(): Promise<State[]> {
        return this.statesRepository.find();
    }

}