import { Body, Controller, Get, Post } from "@nestjs/common";
import { CountriesService } from "./countries.service";
import { Country } from "src/common/entities/country.entity";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { State } from "src/common/entities/state.entity";

@ApiTags('Countries')
@Controller('countries')
export class CountriesController {
    constructor(private readonly countriesService: CountriesService) { }

    @Get()
    @ApiOperation({ summary: 'List countries' })
    @ApiResponse({ status: 200, description: 'Countries fetched successfully' })
    async getAllCountries(): Promise<Country[]> {
        return this.countriesService.findAll();
    }

    @Get('states')
    @ApiOperation({ summary: 'List states' })
    @ApiResponse({ status: 200, description: 'States fetched successfully' })
    async getAllStates(): Promise<State[]> {
        return this.countriesService.findAllStates();
    }
}
