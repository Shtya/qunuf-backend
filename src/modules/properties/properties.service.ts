import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Property, PropertyStatus } from 'src/common/entities/property.entity';
import { User, UserRole } from 'src/common/entities/user.entity';
import { LessThanOrEqual, Repository } from 'typeorm';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { PropertyFilterDto } from './dto/property-filter.dto';
import { CRUD, CustomPaginatedResponse } from 'src/common/services/crud.service';
import { State } from 'src/common/entities/state.entity';
import { GuestPropertySearchDto } from './dto/guest-property-search.dto';

@Injectable()
export class PropertiesService {
    constructor(
        @InjectRepository(Property)
        public propertyRepo: Repository<Property>,

        @InjectRepository(User)
        public userRepository: Repository<User>,

        @InjectRepository(State)
        public stateRepo: Repository<State>,
    ) { }


    async create(
        userId: string,
        dto: CreatePropertyDto,
        imagePaths: string[],
        docPath: string,
    ): Promise<Property> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const exists = await this.stateRepo.findOne({ where: { id: dto.stateId } });
        if (!exists)
            throw new NotFoundException('Selected state not found');

        const imagesJson = imagePaths.map((path, index) => ({
            url: path,
            is_primary: index === dto.primaryImageIndex,
        }));

        const property = this.propertyRepo.create({
            ...dto,
            userId,
            status: PropertyStatus.PENDING,
            images: imagesJson,
            documentImagePath: docPath,
        });

        return await this.propertyRepo.save(property);

    }

    async update(userId: string, propertyId: string, dto: UpdatePropertyDto, newImages: string[], newDoc?: string) {
        const property = await this.propertyRepo.findOne({ where: { id: propertyId } });

        if (!property) throw new NotFoundException('Property not found');
        if (property.userId !== userId) throw new ForbiddenException('You do not own this property');

        // Prevent update if inactive or rejected
        if ([PropertyStatus.INACTIVE, PropertyStatus.REJECTED].includes(property.status)) {
            throw new BadRequestException('Cannot update property in its current state');
        }

        if (dto.stateId) {
            const exists = await this.stateRepo.findOne({ where: { id: dto.stateId } });
            if (!exists)
                throw new NotFoundException('Selected state not found');

        }
        // 1. Handle Images (Max 6 total)
        if (newImages.length > 0) {
            const currentCount = property.images.length;
            const remainingSlots = 6 - currentCount;

            if (remainingSlots > 0) {
                const imagesToAdd = newImages.slice(0, remainingSlots);
                const ignoredImages = newImages.slice(remainingSlots);

                // Delete files that exceeded the slot limit
                this.cleanupFiles(ignoredImages);

                property.images = [...property.images, ...imagesToAdd.map(url => ({ url, is_primary: false }))];
            } else {
                // No slots left, delete all newly uploaded images
                this.cleanupFiles(newImages);
            }
        }

        // 2. Handle Document Replacement
        if (newDoc) {
            this.deletePhysicalFile(property.documentImagePath);
            property.documentImagePath = newDoc;
        }

        // 3. Update fields & Reset Status
        Object.assign(property, dto);
        property.status = PropertyStatus.PENDING; // Reset to pending after update

        return await this.propertyRepo.save(property);
    }

    async deleteFile(userId: string, propertyId: string, type: 'image' | 'document', fileUrl?: string) {
        const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
        if (!property || property.userId !== userId) throw new ForbiddenException('You do not own this property');

        if (type === 'document') {
            this.deletePhysicalFile(property.documentImagePath);
            property.documentImagePath = '';
        } else {
            property.images = property.images.filter(img => {
                if (img.url === fileUrl) {
                    this.deletePhysicalFile(img.url);
                    return false;
                }
                return true;
            });
        }
        return await this.propertyRepo.save(property);
    }

    async toggleArchive(userId: string, propertyId: string, isArchived: boolean) {
        const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
        if (!property || property.userId !== userId) throw new ForbiddenException();

        property.status = isArchived ? PropertyStatus.ARCHIVED : PropertyStatus.PENDING;
        return await this.propertyRepo.save(property);
    }

    private deletePhysicalFile(filePath: string) {
        const fullPath = join(process.cwd(), filePath);
        if (filePath && existsSync(fullPath)) unlinkSync(fullPath);
    }

    private cleanupFiles(paths: string[]) {
        paths.forEach(p => this.deletePhysicalFile(p));
    }

    async updateStatus(id: string, status: PropertyStatus) {
        const property = await this.propertyRepo.findOne({ where: { id } });
        if (!property) throw new NotFoundException('Property not found');

        property.status = status;
        return await this.propertyRepo.save(property);
    }

    /**
     * Guest Action: Shows only Active properties and hides sensitive legal data
     */
    async findOneForGuest(id: string) {
        const property = await this.propertyRepo.findOne({
            where: { id, status: PropertyStatus.ACTIVE },
        });

        if (!property) throw new NotFoundException('Property not found or not available');

        // Remove sensitive fields for public view
        const {
            documentImagePath,
            ownerIdNumber,
            documentNumber,
            gasMeterNumber,
            electricityMeterNumber,
            waterMeterNumber,
            insurancePolicyNumber,
            ...publicData
        } = property;

        return publicData;
    }

    /**
     * Owner/Admin Action: Shows everything
     */
    async findOneFull(id: string, user: any) {
        const property = await this.propertyRepo.findOne({ where: { id } });
        if (!property) throw new NotFoundException('Property not found');

        // If requester is a Landlord, they must be the owner
        const isAdmin = user.role === UserRole.ADMIN;
        const isOwner = property.userId === user.id;

        if (!isAdmin && !isOwner) {
            throw new ForbiddenException('You do not have permission to view this property details');
        }

        return property;
    }

    async findAll(user: any, query: PropertyFilterDto) {
        // 1. Build dynamic filters
        const filters: Record<string, any> = {};

        // Force Landlord to see only their own properties
        if (user.role === UserRole.LANDLORD) {
            filters.userId = user.id;
        }

        // Apply Status Filter
        if (query.status && query.status !== 'all') {
            filters.status = query.status;
        }

        if (query.isFurnished !== undefined) {
            filters.isFurnished = query.isFurnished;
        }

        if (query.isRented !== undefined) {
            filters.isRented = query.isRented;
        }

        // 2. Call your existing CRUD utility
        return CRUD.findAll<Property>(
            this.propertyRepo,
            'property',
            query.search,
            query.page,
            query.limit,
            query.sortBy,
            query.sortOrder,
            [], // relations
            ['name', 'propertyNumber'], // search fields
            filters,
            [] // extra selects
        );
    }

    async searchProperties(query: GuestPropertySearchDto): Promise<CustomPaginatedResponse<Property>> {
        const {
            page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC',
            stateId, rentType, propertyType, subType, paymentType, isFurnished,
            minPrice, maxPrice, minArea, maxArea, constructionDate,
            bedrooms, bathrooms, livingRooms, maidRoom
        } = query;

        const queryBuilder = this.propertyRepo.createQueryBuilder('p');

        // 1. Mandatory Security Filter: Only Active Properties
        queryBuilder.where('p.status = :status', { status: PropertyStatus.ACTIVE });

        // 2. Basic Column Filters
        if (stateId) queryBuilder.andWhere('p.national_address_code LIKE :stateId', { stateId: `${stateId}%` });
        if (rentType) queryBuilder.andWhere('p.rent_type = :rentType', { rentType });
        if (propertyType) queryBuilder.andWhere('p.property_type = :propertyType', { propertyType });
        if (subType) queryBuilder.andWhere('p.sub_type = :subType', { subType });
        if (paymentType) queryBuilder.andWhere('p.payment_type = :paymentType', { paymentType });
        if (isFurnished !== undefined) queryBuilder.andWhere('p.is_furnished = :isFurnished', { isFurnished });
        if (constructionDate) queryBuilder.andWhere('p.construction_date >= :constructionDate', { constructionDate });

        // 3. Range Filters (Price & Area)
        if (minPrice) queryBuilder.andWhere('p.rent_price >= :minPrice', { minPrice });
        if (maxPrice) queryBuilder.andWhere('p.rent_price <= :maxPrice', { maxPrice });
        if (minArea) queryBuilder.andWhere('p.area >= :minArea', { minArea });
        if (maxArea) queryBuilder.andWhere('p.area <= :maxArea', { maxArea });

        // 4. JSONB Facilities Filtering (PostgreSQL Syntax)
        if (bedrooms) queryBuilder.andWhere("p.facilities->>'bedrooms' = :bedrooms", { bedrooms });
        if (bathrooms) queryBuilder.andWhere("p.facilities->>'bathrooms' = :bathrooms", { bathrooms });
        if (livingRooms) queryBuilder.andWhere("p.facilities->>'livingRooms' = :livingRooms", { livingRooms });
        if (maidRoom !== undefined) queryBuilder.andWhere("p.facilities->>'maidRoom' = :maidRoom", { maidRoom: String(maidRoom) });

        // 7. Pagination & Sorting
        const skip = (page - 1) * limit;
        queryBuilder
            .orderBy(`p.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
            .skip(skip)
            .take(limit);

        // 8. Execute and Format Response
        const [records, total] = await queryBuilder.getManyAndCount();

        // Data Trimming: Remove sensitive fields from guest view
        const publicRecords = records.map(p => {
            const { documentImagePath, ownerIdNumber, documentNumber, gasMeterNumber, ...rest } = p;
            return rest;
        });

        return {
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
            },
            records: publicRecords as any,
        };
    }
}
