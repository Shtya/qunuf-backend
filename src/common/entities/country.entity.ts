import { Column, Entity } from "typeorm";
import { CoreEntity } from "./coreEntity";



@Entity('countries')
export class Country extends CoreEntity {
    @Column({ unique: true })
    name: string;

    @Column({ name: 'name_ar', unique: true })
    name_ar: string;

    @Column({ name: 'iso2', unique: true })
    iso2: string;

    @Column({ name: 'iso3', })
    iso3: string;

    @Column({ name: 'currency' })
    currency: string;

    @Column({ name: 'numeric_code' })
    numericCode: string;

    @Column({ name: 'emoji' })
    emoji: string;

    @Column({ name: 'currency_name' })
    currencyName: string;

    @Column({ name: 'currency_symbol' })
    currencySymbol: string;

    @Column({ name: 'native' })
    native: string;
}