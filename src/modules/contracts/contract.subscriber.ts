import {
    EventSubscriber,
    EntitySubscriberInterface,
    InsertEvent,
    DataSource,
    EntityManager,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Contract } from 'src/common/entities/contract.entity';
import { EmailService } from '../email/email.service';
import { Review } from 'src/common/entities/review.entity';
import { Property } from 'src/common/entities/property.entity';

@Injectable()
@EventSubscriber()
export class ContractSubscriber implements EntitySubscriberInterface<Contract> {
    constructor(
        dataSource: DataSource,
        private readonly emailService: EmailService,
    ) {
        dataSource.subscribers.push(this);
    }

    listenTo() {
        return Contract;
    }

    async afterInsert(event: InsertEvent<Contract>) {
        const contract = event.entity;
        if (!contract || !contract.tenantSnapshot || !contract.propertyId) return;

        try {
            // Get tenant email from snapshot
            const tenantEmail = contract.tenantSnapshot.email;
            if (!tenantEmail) {
                console.log('[ContractSubscriber] Tenant email not found in snapshot, skipping email');
                return;
            }

            // Fetch property reviews (limit to 5 most recent for preview)
            const reviews = await this.getPropertyReviews(event.manager, contract.propertyId, 5);

            // Fetch property to get average rating
            const property = await event.manager.findOne(Property, {
                where: { id: contract.propertyId },
                select: ['id', 'averageRating']
            });

            // Send email to tenant with property reviews
            await this.emailService.sendContractNotification(
                tenantEmail,
                contract,
                reviews,
                property?.averageRating || null
            );

            console.log(`[ContractSubscriber] Contract notification email sent to tenant ${tenantEmail} for property ${contract.propertyId}`);
        } catch (error) {
            console.error('[ContractSubscriber] Error sending contract notification email:', error);
        }
    }

    private async getPropertyReviews(
        manager: EntityManager,
        propertyId: string,
        limit: number = 5
    ): Promise<any[]> {
        const reviews = await manager
            .getRepository(Review)
            .createQueryBuilder('review')
            .leftJoinAndSelect('review.tenant', 'tenant')
            .select([
                'review.id',
                'review.rate',
                'review.reviewText',
                'review.created_at',
                'tenant.name',
            ])
            .where('review.propertyId = :propertyId', { propertyId })
            .orderBy('review.created_at', 'DESC')
            .take(limit)
            .getMany();

        return reviews.map(review => ({
            reviewerName: review.tenant?.name || 'Anonymous',
            rate: review.rate,
            time: review.created_at,
            text: review.reviewText || '',
        }));
    }
}
