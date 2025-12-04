import { Column, Entity } from 'typeorm';
import { CoreEntity } from './coreEntity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('departments')
export class Department extends CoreEntity {
    @Column({ length: 255, name: 'title_ar' })
    @ApiProperty({ description: 'Title in Arabic' })
    title_ar: string;

    @Column({ length: 255, name: 'title_en' })
    @ApiProperty({ description: 'Title in English' })
    title_en: string;

    @Column({ type: 'text', name: 'description_ar' })
    @ApiProperty({ description: 'Description in Arabic', required: true })
    description_ar: string;

    @Column({ type: 'text', name: 'description_en' })
    @ApiProperty({ description: 'Description in English', required: true })
    description_en: string;

    @Column({ type: 'varchar', length: 1024 })
    @ApiProperty({ description: 'Image file path (relative to project root)', required: true })
    imagePath: string;
}
