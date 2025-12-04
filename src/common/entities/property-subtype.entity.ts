import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PropertyType } from './property-type.entity';
import { CoreEntity } from './coreEntity';


@Entity('PropertySubtypes')
export class PropertySubtype extends CoreEntity {
    @Column({ name: 'property_type_id' })
    propertyTypeId: string;

    @ManyToOne('PropertyType', 'PropertySubtype')
    @JoinColumn({ name: 'property_type_id' })
    propertyType: PropertyType;

    @Column({ type: 'varchar', length: 50 })
    name: string;
}
