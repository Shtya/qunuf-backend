import { Entity, Column } from 'typeorm';
import { CoreEntity } from './coreEntity';


@Entity('States')
export class State extends CoreEntity {
    @Column({ type: 'varchar', length: 255, unique: true })
    name: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    name_ar: string;

    @Column({ unique: true })
    region_code: string;
}
