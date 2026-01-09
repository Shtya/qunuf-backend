import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { UserRole } from 'src/common/entities/user.entity';
import { ApiOperation } from '@nestjs/swagger';
import { create } from 'domain';
import { CreatePropertyDto } from './dto/create-property.dto';
import { Auth } from 'src/common/decorators/auth.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { User } from 'src/common/decorators/user.decorator';
import { imageUploadConfig } from 'src/common/utils/file.util';
import { PropertyFileValidationPipe } from 'src/common/pipes/property-file-validation.pipe';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyStatus } from 'src/common/entities/property.entity';
import { PropertyFilterDto } from './dto/property-filter.dto';
import { GuestPropertySearchDto } from './dto/guest-property-search.dto';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {

  }

  @Post()
  @Auth(UserRole.LANDLORD)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 6 },
    { name: 'documentImage', maxCount: 1 }
  ], imageUploadConfig('properties', 30)))
  @ApiOperation({ summary: 'Landlord: Create new property (Sets to Pending)' })
  async create(
    @User() user: any,
    @UploadedFiles(PropertyFileValidationPipe) files: { images?: any[], documentImage?: any[] },
    @Body() dto: CreatePropertyDto
  ) {
    const imagePaths = files.images?.map(f => `uploads/images/properties/${f.filename}`) || [];
    const docPath = files.documentImage?.[0] ? `uploads/images/properties/${files.documentImage[0].filename}` : '';

    // Logic inside service sets status to PENDING and links userId
    return this.propertiesService.create(user.id, dto, imagePaths, docPath);
  }

  @Put(':id')
  @Auth(UserRole.LANDLORD)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 6 },
    { name: 'documentImage', maxCount: 1 }
  ], imageUploadConfig('properties', 30)))
  async update(
    @User() user: any,
    @Param('id') id: string,
    @UploadedFiles(PropertyFileValidationPipe) files: { images?: any[], documentImage?: any[] },
    @Body() dto: UpdatePropertyDto
  ) {
    const imagePaths = files.images?.map(f => `uploads/images/properties/${f.filename}`) || [];
    const docPath = files.documentImage?.[0] ? `uploads/images/properties/${files.documentImage[0].filename}` : undefined;

    return this.propertiesService.update(user.id, id, dto, imagePaths, docPath);
  }

  @Delete(':id/files')
  @Auth(UserRole.LANDLORD)
  async removeFile(
    @User() user: any,
    @Param('id') id: string,
    @Query('type') type: 'image' | 'document',
    @Query('url') url?: string
  ) {
    return this.propertiesService.deleteFile(user.id, id, type, url);
  }

  @Patch(':id/archive')
  @Auth(UserRole.LANDLORD)
  async setArchive(@User() user: any, @Param('id') id: string, @Body('archive') archive: boolean) {
    return this.propertiesService.toggleArchive(user.id, id, archive);
  }

  @Patch(':id/status')
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Update property status to any status' })
  async adminUpdateStatus(
    @Param('id') id: string,
    @Body('status') status: PropertyStatus,
  ) {

    return this.propertiesService.updateStatus(id, status);
  }

  // --- GUEST (PUBLIC) ---
  @Get(':id/details')
  @ApiOperation({ summary: 'Guest: Get general property details (Limited info)' })
  async getPublicDetails(@Param('id') id: string) {
    return this.propertiesService.findOneForGuest(id);
  }

  // --- PRIVATE (ADMIN & OWNER) ---
  @Get(':id/full-details')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  @ApiOperation({ summary: 'Admin/Owner: Get all property details including documents' })
  async getFullDetails(
    @User() user: any,
    @Param('id') id: string
  ) {
    return this.propertiesService.findOneFull(id, user.id);
  }

  @Get('all')
  @Auth(UserRole.ADMIN, UserRole.LANDLORD)
  @ApiOperation({ summary: 'Admin/Landlord: Get paginated properties with filters' })
  async findAll(
    @User() user: any,
    @Query() query: PropertyFilterDto,
  ) {
    return this.propertiesService.findAll(user, query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Guest: Advanced property search' })
  async search(@Query() query: GuestPropertySearchDto) {
    return this.propertiesService.searchProperties(query);
  }
}
