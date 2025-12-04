import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


import { SAUDI_STATES, PROPERTY_TYPES } from './seed-data';
import { State } from 'src/common/entities/state.entity';
import { PropertyType } from 'src/common/entities/property-type.entity';
import { PropertySubtype } from 'src/common/entities/property-subtype.entity';

@Injectable()
export class SeedService {
    private readonly logger = new Logger(SeedService.name);

    constructor(
        @InjectRepository(State)
        private readonly stateRepo: Repository<State>,

        @InjectRepository(PropertyType)
        private readonly propertyTypeRepo: Repository<PropertyType>,

        @InjectRepository(PropertySubtype)
        private readonly propertySubtypeRepo: Repository<PropertySubtype>,
    ) { }

    async seedStates() {
        for (const stateName of SAUDI_STATES) {
            const exists = await this.stateRepo.findOne({ where: { name: stateName } });
            if (!exists) {
                const created = this.stateRepo.create({ name: stateName });
                await this.stateRepo.save(created);
                this.logger.log(`Added State: ${stateName}`);
            } else {
                this.logger.log(`State exists: ${stateName}`);
            }
        }
    }

    async seedPropertyTypes() {
        for (const type of PROPERTY_TYPES) {
            let propertyType = await this.propertyTypeRepo.findOne({
                where: { name: type.name },
            });

            if (!propertyType) {
                propertyType = this.propertyTypeRepo.create({ name: type.name });
                propertyType = await this.propertyTypeRepo.save(propertyType);

                this.logger.log(`Added PropertyType: ${type.name}`);
            } else {
                this.logger.log(`PropertyType exists: ${type.name}`);
            }

            for (const subtypeName of type.subtypes) {
                const exists = await this.propertySubtypeRepo.findOne({
                    where: { name: subtypeName, propertyTypeId: propertyType.id },
                });

                if (!exists) {
                    const created = this.propertySubtypeRepo.create({
                        name: subtypeName,
                        propertyTypeId: propertyType.id,
                    });
                    await this.propertySubtypeRepo.save(created);

                    this.logger.log(`   Added Subtype: ${subtypeName} -> ${type.name}`);
                } else {
                    this.logger.log(`   Subtype exists: ${subtypeName}`);
                }
            }
        }
    }

    async runAll() {
        this.logger.log('--- Seeding START ---');
        await this.seedStates();
        await this.seedPropertyTypes();
        this.logger.log('--- Seeding DONE ---');
    }
}
