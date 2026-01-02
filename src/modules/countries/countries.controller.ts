import { Body, Controller, Get, Post } from "@nestjs/common";
import { CountriesService } from "./countries.service";
import { Country } from "src/common/entities/country.entity";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags('Countries')
@Controller('countries')
export class CountriesController {
    constructor(private readonly countriesService: CountriesService) { }

    @Get()
    @Get()
    @ApiOperation({ summary: 'List countries' })
    @ApiResponse({ status: 200, description: 'Countries fetched successfully' })
    async getAllCountries(): Promise<Country[]> {
        return this.countriesService.findAll();
    }


}
