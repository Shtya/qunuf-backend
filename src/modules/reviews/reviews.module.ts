import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from 'src/common/entities/review.entity';
import { Contract } from 'src/common/entities/contract.entity';
import { Property } from 'src/common/entities/property.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { ReviewSubscriber } from './review.subscriber';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Review,
            Contract,
            Property
        ])
    ],
    controllers: [ReviewsController],
    providers: [ReviewsService, ReviewSubscriber],
    exports: [ReviewsService]
})
export class ReviewsModule { }
