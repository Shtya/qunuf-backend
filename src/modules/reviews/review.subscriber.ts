import {
    EventSubscriber,
    EntitySubscriberInterface,
    InsertEvent,
    UpdateEvent,
    DataSource,
    EntityManager,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Review } from 'src/common/entities/review.entity';
import { Property } from 'src/common/entities/property.entity';

@Injectable()
@EventSubscriber()
export class ReviewSubscriber implements EntitySubscriberInterface<Review> {
    constructor(dataSource: DataSource) {
        dataSource.subscribers.push(this);
    }

    listenTo() {
        return Review;
    }

    async afterInsert(event: InsertEvent<Review>) {
        const review = event.entity;
        if (!review || !review.propertyId) return;

        try {
            await this.recalculateAverageRating(event.manager, review.propertyId);
        } catch (error) {
            console.error('[ReviewSubscriber] Error recalculating average rating after insert:', error);
        }
    }

    async afterUpdate(event: UpdateEvent<Review>) {
        if (!event.databaseEntity || !event.entity) {
            return;
        }

        // Get propertyId from either the updated entity or the database entity
        const propertyId = event.entity?.propertyId || event.databaseEntity?.propertyId;
        if (!propertyId) return;

        try {
            await this.recalculateAverageRating(event.manager, propertyId);
        } catch (error) {
            console.error('[ReviewSubscriber] Error recalculating average rating after update:', error);
        }
    }

    private async recalculateAverageRating(
        manager: EntityManager,
        propertyId: string
    ) {
        // Calculate average rating from all reviews for this property
        const result = await manager
            .getRepository(Review)
            .createQueryBuilder('review')
            .select('AVG(review.rate)', 'average')
            .addSelect('COUNT(review.id)', 'count')
            .where('review.property_id = :propertyId', { propertyId })
            .getRawOne();

        const averageRating = result?.average ? parseFloat(result.average) : null;
        const reviewCount = parseInt(result?.count || '0', 10);

        // Update property's average rating
        await manager.update(
            Property,
            { id: propertyId },
            { averageRating: averageRating }
        );

        console.log(
            `[ReviewSubscriber] Updated average rating for property ${propertyId}: ${averageRating?.toFixed(2)} (from ${reviewCount} reviews)`
        );
    }
}
