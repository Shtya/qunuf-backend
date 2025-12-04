import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


import { SAUDI_STATES, PROPERTY_TYPES, COMPANY_SECTIONS, DEPARTMENTS, TEAM_MEMBERS } from './seed-data';
import { State } from 'src/common/entities/state.entity';
import { PropertyType } from 'src/common/entities/property-type.entity';
import { PropertySubtype } from 'src/common/entities/property-subtype.entity';
import { CompanyInfo } from 'src/common/entities/companyInfo.entity';
import { Department } from 'src/common/entities/department.entity';
import { TeamMember } from 'src/common/entities/team.entity';

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

        @InjectRepository(CompanyInfo)
        private readonly companyInfoRepo: Repository<CompanyInfo>,

        @InjectRepository(Department)
        private readonly departmentRepo: Repository<Department>,

        @InjectRepository(TeamMember)
        private readonly teamMemberRepo: Repository<TeamMember>,

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

    async seedCompanyInfo() {
        for (const sec of COMPANY_SECTIONS) {
            const exists = await this.companyInfoRepo.findOne({ where: { section: sec.section } });
            if (!exists) {
                const created = this.companyInfoRepo.create(sec);
                await this.companyInfoRepo.save(created);
                this.logger.log(`Added CompanyInfo: ${sec.section}`);
            } else {
                this.logger.log(`CompanyInfo exists: ${sec.section}`);
            }
        }
    }

    async seedDepartments() {
        for (const dept of DEPARTMENTS) {
            const exists = await this.departmentRepo.findOne({ where: { title_en: dept.title_en } });
            if (!exists) {
                const created = this.departmentRepo.create(dept);
                await this.departmentRepo.save(created);
                this.logger.log(`Added Department: ${dept.title_en}`);
            } else {
                this.logger.log(`Department exists: ${dept.title_en}`);
            }
        }
    }

    async seedTeamMembers() {
        for (const member of TEAM_MEMBERS) {
            const exists = await this.teamMemberRepo.findOne({ where: { name: member.name, job: member.job } });
            if (!exists) {
                const created = this.teamMemberRepo.create(member);
                await this.teamMemberRepo.save(created);
                this.logger.log(`Added TeamMember: ${member.name} (${member.job})`);
            } else {
                this.logger.log(`TeamMember exists: ${member.name}`);
            }
        }
    }

    async runAll() {
        this.logger.log('--- Seeding START ---');
        await this.seedStates();
        await this.seedPropertyTypes();
        await this.seedCompanyInfo();
        await this.seedDepartments();
        await this.seedTeamMembers();
        this.logger.log('--- Seeding DONE ---');
    }
}
