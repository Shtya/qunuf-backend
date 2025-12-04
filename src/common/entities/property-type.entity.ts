import { Entity, Column, OneToMany, Relation } from 'typeorm';
import { CoreEntity } from './coreEntity';
import { PropertySubtype } from './property-subtype.entity';

@Entity('PropertyTypes')
export class PropertyType extends CoreEntity {
    @Column({ type: 'varchar', length: 50, unique: true })
    name: string;

    @OneToMany('PropertySubtype', 'PropertyType')
    subtypes: Relation<PropertySubtype[]>;
}
