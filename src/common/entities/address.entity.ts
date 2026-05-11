import { Entity, Column, OneToOne, ManyToOne, JoinColumn, Relation } from 'typeorm';

import { User } from './user.entity';
import { State } from './state.entity';
import { CoreEntity } from './coreEntity';

@Entity('addresses')
export class Address extends CoreEntity {
    @Column({ type: 'uuid', name: 'state_id' })
    stateId: string;

    // Example: "Riyadh"
    @ManyToOne(() => State, { nullable: false, eager: true })
    @JoinColumn({ name: 'state_id' })
    state: State;

    // Example: "Riyadh" or "Jeddah"
    @Column({ type: 'varchar', length: 255 })
    city: string;

    // Example: "Prince Mohammed bin Abdulaziz St."
    @Column({ type: 'varchar', length: 255, name: 'street_name' })
    streetName: string;

    // Building number can contain letters so string is safer (e.g. "12A")
    @Column({ type: 'varchar', length: 50, name: 'building_number' })
    buildingNumber: string;

    // Optional postal code
    @Column({ type: 'varchar', length: 20, nullable: true, name: 'postal_code' })
    postalCode?: string | null;

    // Optional additional number / sub-number
    @Column({ type: 'varchar', length: 50, nullable: true, name: 'additional_number' })
    additionalNumber?: string | null;

    @Column({ type: 'uuid', name: 'user_id' })
    userId: string;

    // One-to-one relation to user. Address owns the FK (user_id).
    @OneToOne("User", "Address", { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user: Relation<User>;
}
