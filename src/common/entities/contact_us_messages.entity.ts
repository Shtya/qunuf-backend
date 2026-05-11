import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CoreEntity } from './coreEntity';

@Entity('contact_us_messages')
export class ContactUsMessage extends CoreEntity {
    @Column({ length: 255 })
    @ApiProperty({ description: 'Client name' })
    name: string;

    @Column({ length: 255 })
    @ApiProperty({ description: 'Client email' })
    email: string;

    @Column({ length: 50 })
    @ApiProperty({ description: 'Client phone' })
    phone: string;

    @Column({ type: 'text' })
    @ApiProperty({ description: 'How the client heard about the platform' })
    message: string;

    @Column({ name: 'inquiry', type: 'text', nullable: true })
    @ApiProperty({ description: 'Contact message text', required: false })
    inquiry: string | null;
}
