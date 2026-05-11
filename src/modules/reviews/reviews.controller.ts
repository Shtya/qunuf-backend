import { Controller, Post, Body, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Auth } from 'src/common/decorators/auth.decorator';
import { UserRole } from 'src/common/entities/user.entity';
import { User } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { decodeCursor, encodeCursor } from 'src/common/utils/crud.util';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
    constructor(
        private readonly reviewsService: ReviewsService,
    ) { }

    @Post()
    @Auth(UserRole.TENANT)
    @ApiOperation({ summary: 'Add a review for a contract' })
    @ApiResponse({ status: 201, description: 'Review created successfully' })
    @ApiResponse({ status: 400, description: 'Contract not activated or already reviewed' })
    @ApiResponse({ status: 403, description: 'Not authorized to review this contract' })
    async create(
        @User() user: any,
        @Body() dto: CreateReviewDto
    ) {
        return this.reviewsService.create(user.id, dto);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get a single review by ID' })
    @ApiParam({ name: 'id', description: 'Review UUID' })
    @ApiResponse({ status: 200, description: 'Review found' })
    @ApiResponse({ status: 404, description: 'Review not found' })
    async findOne(@Param('id') id: string) {
        return this.reviewsService.findOne(id);
    }

    @Get('contract/:contractId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get cursor paginated reviews for a specific contract' })
    @ApiParam({ name: 'contractId', description: 'Contract UUID' })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Base64 encoded cursor of id and createdAt' })
    @ApiQuery({ name: 'limit', required: false, schema: { default: 20, maximum: 50 } })
    @ApiResponse({ status: 200, description: 'Returns a list of reviews and the next cursor' })
    async findByContract(
        @Param('contractId') contractId: string,
        @Query('cursor') cursor?: string,
        @Query('limit') limit: number = 20
    ) {
        const safeLimit = Math.min(Number(limit) || 20, 50);
        const parsedCursor = decodeCursor(cursor);

        const result = await this.reviewsService.findByContract(contractId, parsedCursor, safeLimit);

        return {
            ...result,
            items: result.items,
            nextCursor: encodeCursor(result.nextCursor),
            hasMore: result.hasMore
        };
    }

    @Get('property/:propertyId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get cursor paginated reviews for a specific property' })
    @ApiParam({ name: 'propertyId', description: 'Property UUID' })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Base64 encoded cursor of id and createdAt' })
    @ApiQuery({ name: 'limit', required: false, schema: { default: 20, maximum: 50 } })
    @ApiResponse({ status: 200, description: 'Returns a list of reviews and the next cursor' })
    async findByProperty(
        @Param('propertyId') propertyId: string,
        @Query('cursor') cursor?: string,
        @Query('limit') limit: number = 20
    ) {
        const safeLimit = Math.min(Number(limit) || 20, 50);
        const parsedCursor = decodeCursor(cursor);

        const result = await this.reviewsService.findByProperty(propertyId, parsedCursor, safeLimit);

        return {
            ...result,
            items: result.items,
            nextCursor: encodeCursor(result.nextCursor),
            hasMore: result.hasMore
        };
    }
}
