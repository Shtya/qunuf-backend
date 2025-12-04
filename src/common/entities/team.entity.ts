import { Column, Entity } from 'typeorm';
import { CoreEntity } from './coreEntity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('team_members')
export class TeamMember extends CoreEntity {
    @Column({ length: 255 })
    @ApiProperty({ description: 'Member name' })
    name: string;

    @Column({ length: 255 })
    @ApiProperty({ description: 'Job title' })
    job: string;

    @Column({ type: 'text', name: 'description_ar' })
    @ApiProperty({ description: 'Description in Arabic', required: true })
    description_ar: string | null;

    @Column({ type: 'text', name: 'description_en' })
    @ApiProperty({ description: 'Description in English', required: true })
    description_en: string | null;

    @Column({ type: 'varchar', length: 1024 })
    @ApiProperty({ description: 'Image path', required: true })
    imagePath: string | null;
}
