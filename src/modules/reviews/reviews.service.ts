import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from 'src/common/entities/review.entity';
import { Contract } from 'src/common/entities/contract.entity';
import { Property } from 'src/common/entities/property.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { CRUD } from 'src/common/services/crud.service';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(Review)
        private readonly reviewRepo: Repository<Review>,
        @InjectRepository(Contract)
        private readonly contractRepo: Repository<Contract>,
        @InjectRepository(Property)
        private readonly propertyRepo: Repository<Property>,
    ) { }

    async create(tenantId: string, dto: CreateReviewDto): Promise<Review> {
        // 1. Fetch contract and verify it exists
        const contract = await this.contractRepo.findOne({
            where: { id: dto.contractId },
            relations: ['property']
        });

        if (!contract) {
            throw new NotFoundException('Contract not found');
        }

        // 2. Verify the tenant is the owner of this contract
        if (contract.tenantId !== tenantId) {
            throw new ForbiddenException('You can only review your own contracts');
        }

        // 3. Verify the contract was activated (contractNumber is set when activated)
        // Once activated, tenant can review regardless of current status (ACTIVE, EXPIRED, TERMINATED, etc.)
        if (!contract.contractNumber) {
            throw new BadRequestException('You can only review contracts that have been activated');
        }

        if (contract.isReviewed) {
            throw new BadRequestException('This contract has already been reviewed');
        }

        // 4. Check if tenant already reviewed this contract
        const existingReview = await this.reviewRepo.findOne({
            where: {
                contractId: dto.contractId,
                tenantId: tenantId
            }
        });

        if (existingReview) {
            throw new BadRequestException('You have already reviewed this contract');
        }

        // 5. Create the review
        return await this.reviewRepo.manager.transaction(async (transactionalEntityManager) => {
            // Create the review
            const review = transactionalEntityManager.create(Review, {
                contractId: dto.contractId,
                propertyId: contract.propertyId,
                tenantId: tenantId,
                rate: dto.rate,
                reviewText: dto.reviewText || null
            });

            const savedReview = await transactionalEntityManager.save(review);

            // Update the contract marker
            contract.isReviewed = true;
            await transactionalEntityManager.save(contract);

            return savedReview;
        });
    }

    async findOne(id: string): Promise<Review> {
        const review = await this.reviewRepo.findOne({
            where: { id },
            relations: ['contract', 'property', 'tenant']
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        return review;
    }

    async findByContract(
        contractId: string,
        cursor?: { createdAt: Date; id: string },
        limit: number = 20
    ) {
        // Verify contract exists
        const contract = await this.contractRepo.findOne({
            where: { id: contractId }
        });

        if (!contract) {
            throw new NotFoundException('Contract not found');
        }

        const queryBuilder = this.reviewRepo
            .createQueryBuilder('review')
            .leftJoinAndSelect('review.tenant', 'tenant')
            .select([
                'review.id',
                'review.created_at',
                'review.updated_at',
                'review.rate',
                'review.review_text',
                'review.contract_id',
                'review.property_id',
                'review.tenant_id',
                'review.reviewText',
                'tenant.id',
                'tenant.name',
                'tenant.imagePath',
            ])
            .where('review.contract_id = :contractId', { contractId });

        return CRUD.paginateCursor({
            queryBuilder,
            alias: 'review',
            cursor,
            limit,
        });
    }

    async findByProperty(
        propertyId: string,
        cursor?: { createdAt: Date; id: string },
        limit: number = 20
    ) {
        // Verify property exists
        const property = await this.propertyRepo.findOne({
            where: { id: propertyId }
        });

        if (!property) {
            throw new NotFoundException('Property not found');
        }

        const queryBuilder = this.reviewRepo
            .createQueryBuilder('review')
            .leftJoinAndSelect('review.tenant', 'tenant')
            .leftJoinAndSelect('review.contract', 'contract')
            .select([
                'review.id',
                'review.created_at',
                'review.updated_at',
                'review.rate',
                'review.review_text',
                'review.contract_id',
                'review.property_id',
                'review.tenant_id',
                'review.reviewText',
                'tenant.id',
                'tenant.name',
                'tenant.imagePath',
                'contract.id',
                'contract.contractNumber',

            ])
            .where('review.property_id = :propertyId', { propertyId });

        return CRUD.paginateCursor({
            queryBuilder,
            alias: 'review',
            cursor,
            limit,
        });
    }
}
