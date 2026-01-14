import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
import { NotificationService } from '../notification/notification.service';
import { trimText } from 'src/common/utils/helpers';
import { ExportService } from 'src/common/services/exportService';

@Injectable()
export class PropertiesService {
    constructor(
        @InjectRepository(Property)
        public propertyRepo: Repository<Property>,

        @InjectRepository(User)
        public userRepository: Repository<User>,

        @InjectRepository(State)
        public stateRepo: Repository<State>,
        private notificationService: NotificationService,

        private readonly exportService: ExportService,
    ) { }


    async create(
        userId: string,
        dto: CreatePropertyDto,
        imagePaths: string[],
        doc: { path: string, filename: string } | null,
    ): Promise<Property> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const exists = await this.stateRepo.findOne({ where: { id: dto.stateId } });
        if (!exists)
            throw new NotFoundException('Selected state not found');

        const primaryImageIndex = dto.primaryImageIndex || 0;
        const imagesJson = imagePaths.map((path, index) => ({
            url: path,
            is_primary: index === primaryImageIndex,
        }));

        const property = this.propertyRepo.create({
            ...dto,
            userId,
            status: PropertyStatus.PENDING,
            images: imagesJson,
            documentImage: doc,
        });

        const admin = await this.userRepository.findOne({
            where: { role: UserRole.ADMIN },
            select: ['id']
        });

        const savedProperty = await this.propertyRepo.save(property);

        if (admin) {
            await this.notificationService.createNotification(
                admin.id,
                'NEW_PROPERTY_SUBMITTED',
                'New Property Awaiting Review',
                `A new property listing "${trimText(savedProperty.name)}" has been submitted and is awaiting approval.`,
                'property',
                savedProperty.id
            );
        }

        return savedProperty;

    }

    async update(userId: string, propertyId: string, dto: UpdatePropertyDto, newImages: string[], newDoc: { path: string, filename: string } | null) {
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
        if (dto.primaryImageIndex && property.images[dto.primaryImageIndex]) {
            property.images[dto.primaryImageIndex].is_primary = true;
        }

        // 2. Handle Document Replacement
        if (newDoc) {
            this.deletePhysicalFile(property.documentImage?.path);
            property.documentImage = newDoc;
        }

        // 3. Update fields & Reset Status
        Object.assign(property, dto);
        property.status = PropertyStatus.PENDING; // Reset to pending after update

        const updatedProperty = await this.propertyRepo.save(property);

        // 4. Notify Admin of the Update
        const admin = await this.userRepository.findOne({
            where: { role: UserRole.ADMIN },
            select: ['id']
        });

        if (admin) {
            await this.notificationService.createNotification(
                admin.id,
                'PROPERTY_UPDATED',
                'Property Details Updated',
                `Changes have been made to the property: "${trimText(updatedProperty.name)}". Please re-review the details for approval.`,
                'property',
                updatedProperty.id
            );
        }

        return updatedProperty;
    }

    async deleteFile(userId: string, propertyId: string, type: 'image' | 'document', fileUrl?: string) {
        const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
        if (!property || property.userId !== userId) throw new ForbiddenException('You do not own this property');

        if (type === 'document') {
            this.deletePhysicalFile(property.documentImage?.path);
            property.documentImage = null
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

    async toggleArchive(userId: string, propertyId: string) {
        const property = await this.propertyRepo.findOne({ where: { id: propertyId } });

        // 1. Check if property exists and belongs to the user
        if (!property) {
            throw new NotFoundException('The requested property could not be found.');
        }

        if (property.userId !== userId) {
            throw new ForbiddenException('You do not have permission to archive or unarchive this property.');
        }

        // Define the statuses that are NOT allowed to be toggled/archived
        const blockedStatuses = [PropertyStatus.REJECTED, PropertyStatus.INACTIVE];

        if (blockedStatuses.includes(property.status)) {
            throw new ForbiddenException(
                `Properties with status ${property.status} cannot be archived or restored.`
            );
        }
        const isArchived = property.status === PropertyStatus.ARCHIVED;

        property.status = isArchived ? PropertyStatus.PENDING : PropertyStatus.ARCHIVED;
        const savedProperty = await this.propertyRepo.save(property);

        return savedProperty;
    }

    private deletePhysicalFile(filePath: string | null | undefined) {
        if (!filePath) return;
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
        const updatedProperty = await this.propertyRepo.save(property);

        let notificationTitle = '';
        let notificationMessage = '';

        // Applying the "Trim" rule for a clean notification layout
        const trimmedName = trimText(updatedProperty.name);

        switch (status) {
            case PropertyStatus.ACTIVE:
                notificationTitle = 'Property Approved';
                notificationMessage = `Your property "${trimmedName}" has been approved and is now active.`;
                break;
            case PropertyStatus.REJECTED:
                notificationTitle = 'Property Rejected';
                notificationMessage = `Your property "${trimmedName}" has been rejected after review.`;
                break;
            case PropertyStatus.INACTIVE:
                notificationTitle = 'Property Deactivated';
                notificationMessage = `Your property "${trimmedName}" is now inactive and hidden from the public.`;
                break;
            case PropertyStatus.ARCHIVED:
                notificationTitle = 'Property Archived';
                notificationMessage = `Your property listing "${trimmedName}" has been archived by the administration.`;
                break;
        }

        if (notificationTitle) {
            await this.notificationService.createNotification(
                property.userId,
                'PROPERTY_STATUS_CHANGED',
                notificationTitle,
                notificationMessage,
                'property',
                property.id
            );
        }

        return updatedProperty;
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
            documentImage,
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
        const property = await this.propertyRepo.findOne({ where: { id }, relations: ['state'] });
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
        if (query.isRented !== undefined) {
            filters.isRented = query.isRented;
        }
        if (query.propertyType && query.propertyType !== 'all') {
            filters.propertyType = query.propertyType;
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
            ['name'], // search fields
            filters,
            [] // extra selects
        );
    }

    async searchProperties(query: GuestPropertySearchDto): Promise<CustomPaginatedResponse<Property>> {
        const {
            page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC',
            stateId, rentType, propertyType, subType, isFurnished,
            minPrice, maxPrice, minArea, maxArea, constructionDate,
            bedrooms, bathrooms, livingRooms, maidRoom
        } = query;

        const queryBuilder = this.propertyRepo.createQueryBuilder('p');

        queryBuilder.select([
            'p.id',
            'p.name',
            'p.description',
            'p.additionalDetails',
            'p.educationInstitutions',
            'p.healthMedicalFacilities',
            'p.status',
            'p.images',
            'p.propertyType',
            'p.subType',
            'p.area',
            'p.constructionDate',
            'p.rentPrice',
            'p.rentType',
            'p.isFurnished',
            'p.facilities',
            'p.features',
            'p.nationalAddressCode',
            'p.latitude',
            'p.longitude',
            'p.created_at',
            'p.complexName',
            'p.capacity'
        ]);

        // 1. Mandatory Security Filter: Only Active Properties
        queryBuilder.where('p.status = :status', { status: PropertyStatus.ACTIVE });
        queryBuilder.andWhere('p.isRented = :isRented', { isRented: false });

        // 2. Basic Column Filters
        if (stateId) queryBuilder.andWhere('p.nationalAddressCode LIKE :stateId', { stateId: `${stateId}%` });
        if (rentType) queryBuilder.andWhere('p.rentType = :rentType', { rentType });
        if (propertyType) queryBuilder.andWhere('p.propertyType = :propertyType', { propertyType });
        if (subType) queryBuilder.andWhere('p.subType = :subType', { subType });
        if (isFurnished !== undefined) queryBuilder.andWhere('p.isFurnished = :isFurnished', { isFurnished });
        if (constructionDate) queryBuilder.andWhere('p.constructionDate >= :constructionDate', { constructionDate });

        // 3. Range Filters (Price & Area)
        if (minPrice) queryBuilder.andWhere('p.rentPrice >= :minPrice', { minPrice });
        if (maxPrice) queryBuilder.andWhere('p.rentPrice <= :maxPrice', { maxPrice });
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
            const { documentImage, ownerIdNumber, documentNumber, gasMeterNumber, ...rest } = p;
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


    async exportProperties(user: any, query: PropertyFilterDto) {

        const filters: Record<string, any> = {};

        // Force Landlord to see only their own properties
        if (user.role === UserRole.LANDLORD) {
            filters.userId = user.id;
        }

        // Apply Status Filter
        if (query.status && query.status !== 'all') {
            filters.status = query.status;
        }
        if (query.isRented !== undefined) {
            filters.isRented = query.isRented;
        }
        if (query.propertyType && query.propertyType !== 'all') {
            filters.propertyType = query.propertyType;
        }

        // 2. Call your existing CRUD utility
        const { records: properties } = await CRUD.findAllLimited<Property>(
            this.propertyRepo,
            'property',
            query.limit,
            query.search,
            query.sortBy,
            query.sortOrder,
            [], // relations
            ['name'], // search fields
            filters,
            [] // extra selects
        );



        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        const exportData = properties.map(p => {
            const propertyLink = `${frontendUrl}/dashboard/properties?view=${p.id}`;

            return {
                name: {
                    formula: `HYPERLINK("${propertyLink}", "${p.name}")`,
                    result: p.name // Fallback text
                },
                propertyNumber: p.propertyNumber,
                status: p.status?.toUpperCase(),
                propertyType: p.propertyType,
                subType: p.subType,
                rentPrice: p.rentPrice,
                rentType: p.rentType,
                area: `${p.area} sqm`,
                isRented: p.isRented ? 'Rented' : 'Available',
                isFurnished: p.isFurnished ? 'Yes' : 'No',
                // Facilities Flattening
                rooms: p.facilities?.rooms || 0,
                bedrooms: p.facilities?.bedrooms || 0,
                bathrooms: p.facilities?.bathrooms || 0,
                livingRooms: p.facilities?.livingRooms || 0,
                kitchens: p.facilities?.kitchen || 0,
                majlis: p.facilities?.majlis || 0,
                parking: p.facilities?.parking || 0,
                elevators: p.facilities?.elevators || 0,
                securityEntrances: p.facilities?.securityEntrances || 0,
                stores: p.facilities?.store || 0,
                maidRoom: p.facilities?.maidRoom ? 'Yes' : 'No',
                backyard: p.facilities?.backyard ? 'Yes' : 'No',
                centralAC: p.facilities?.centralAC ? 'Yes' : 'No',
                desertAC: p.facilities?.desertAC ? 'Yes' : 'No',

                // Meters & Legal
                electricity: p.electricityMeterNumber,
                water: p.waterMeterNumber,
                nationalAddress: p.nationalAddressCode,
                documentNumber: p.documentNumber,
                description: p.description,
                additionalDetails: p.additionalDetails,
                capacity: p.capacity || 'N/A',
                securityDeposit: p.securityDeposit,
                constructionDate: p.constructionDate ? new Date(p.constructionDate).toLocaleDateString() : 'N/A',
                insurancePolicy: p.insurancePolicyNumber || 'N/A',
                ownershipType: p.ownershipType,
                complexName: p.complexName || 'N/A',
                documentType: p.documentType,
                documentIssueDate: p.documentIssueDate ? new Date(p.documentIssueDate).toLocaleDateString() : 'N/A',
                ownerId: p.ownerIdNumber,
                issuedBy: p.issuedBy,
                latitude: p.latitude,
                longitude: p.longitude,
                gasMeter: p.gasMeterNumber || 'N/A',
                features: p.features ? p.features.join(', ') : 'None',

                // Flattening JSONB Arrays for Education & Health
                education: p.educationInstitutions
                    ? p.educationInstitutions.map(e => `${e.name} (${e.distance_km}km)`).join(' | ')
                    : 'None',
                health: p.healthMedicalFacilities
                    ? p.healthMedicalFacilities.map(h => `${h.name} (${h.distance_km}km)`).join(' | ')
                    : 'None',

                createdAt: new Date(p.created_at).toLocaleDateString(),

            }
        });

        // 3. Define professional columns
        const columns = [
            {
                header: 'Property Name', key: 'name', width: 25, style: {
                    font: {
                        color: { argb: 'FF0000FF' }, // Classic link blue
                        underline: true
                    }
                }
            },
            { header: 'Property #', key: 'propertyNumber', width: 12 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Type', key: 'propertyType', width: 15 },
            { header: 'Sub-Type', key: 'subType', width: 15 },
            { header: 'Price', key: 'rentPrice', width: 12 },
            { header: 'Area', key: 'area', width: 12 },

            { header: 'Total Rooms', key: 'rooms', width: 12 },
            { header: 'Bedrooms', key: 'bedrooms', width: 10 },
            { header: 'Bathrooms', key: 'bathrooms', width: 10 },
            { header: 'Living Rooms', key: 'livingRooms', width: 12 },
            { header: 'Kitchens', key: 'kitchens', width: 10 },
            { header: 'Majlis', key: 'majlis', width: 10 },
            { header: 'Parking', key: 'parking', width: 10 },
            { header: 'Elevators', key: 'elevators', width: 10 },
            { header: 'Security Entrances', key: 'securityEntrances', width: 15 },
            { header: 'Store Rooms', key: 'stores', width: 12 },
            { header: 'Maid Room', key: 'maidRoom', width: 10 },
            { header: 'Backyard', key: 'backyard', width: 10 },
            { header: 'Central AC', key: 'centralAC', width: 12 },
            { header: 'Desert AC', key: 'desertAC', width: 12 },

            { header: 'Rented', key: 'isRented', width: 12 },
            { header: 'Rent Type', key: 'rentType', width: 12 },
            { header: 'Furnished', key: 'isFurnished', width: 12 },
            { header: 'Bedrooms', key: 'bedrooms', width: 10 },
            { header: 'Bathrooms', key: 'bathrooms', width: 10 },
            { header: 'Parking', key: 'parking', width: 10 },
            { header: 'AC Type', key: 'acType', width: 15 },

            { header: 'Security Deposit', key: 'securityDeposit', width: 15 },
            { header: 'Construction Date', key: 'constructionDate', width: 18 },
            { header: 'Ownership Type', key: 'ownershipType', width: 15 },
            { header: 'Complex Name', key: 'complexName', width: 20 },

            { header: 'Doc #', key: 'documentNumber', width: 15 },
            { header: 'Doc Type', key: 'documentType', width: 15 },
            { header: 'Doc Issue Date', key: 'documentIssueDate', width: 18 },
            { header: 'Doc Owner ID', key: 'ownerId', width: 15 },
            { header: 'Doc Issued By', key: 'issuedBy', width: 20 },
            { header: 'Insurance Policy #', key: 'insurancePolicy', width: 20 },

            { header: 'Electricity Meter', key: 'electricity', width: 18 },
            { header: 'Water Meter', key: 'water', width: 18 },
            { header: 'Gas Meter', key: 'gasMeter', width: 18 },
            { header: 'Capacity', key: 'capacity', width: 10 },
            { header: 'National Address', key: 'nationalAddress', width: 20 },

            { header: 'Education (Nearby)', key: 'education', width: 40 },
            { header: 'Health Facilities', key: 'health', width: 40 },
            { header: 'Other Features', key: 'features', width: 30 },
            { header: 'Latitude', key: 'latitude', width: 12 },
            { header: 'Longitude', key: 'longitude', width: 12 },

            { header: 'Description', key: 'description', width: 100 },
            { header: 'Additional Details', key: 'additionalDetails', width: 70 },
            { header: 'Created At', key: 'createdAt', width: 15 },
        ];

        return this.exportService.generateExcel('Properties', exportData, columns);
    }
}
