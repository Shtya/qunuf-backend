import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { Auth } from 'src/common/decorators/auth.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { UserRole } from 'src/common/entities/user.entity';
import { ProviderStatus } from 'src/common/entities/service-provider.entity';
import { WorkOrderStatus } from 'src/common/entities/work-order.entity';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';
import { CreateMaintenanceItemDto } from './dto/create-maintenance-item.dto';
import { CreateMaintenanceScheduleDto } from './dto/create-maintenance-schedule.dto';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderStatusDto, RateWorkOrderDto, UpdateWorkOrderDto } from './dto/update-work-order.dto';

@ApiTags('Maintenance')
@Controller('maintenance')
export class MaintenanceController {
    constructor(private readonly maintenanceService: MaintenanceService) {}

    // ─── Service Providers ─────────────────────────────────────────────────────

    @Post('providers')
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin adds a service provider' })
    createProvider(@Body() dto: CreateServiceProviderDto) {
        return this.maintenanceService.createProvider(dto);
    }

    @Get('providers')
    @Auth(UserRole.ADMIN, UserRole.LANDLORD)
    @ApiOperation({ summary: 'List service providers' })
    listProviders(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('status') status?: string,
    ) {
        return this.maintenanceService.listProviders(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
            search,
            status as ProviderStatus | undefined,
        );
    }

    @Patch('providers/:id')
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin updates a service provider' })
    updateProvider(@Param('id') id: string, @Body() dto: UpdateServiceProviderDto) {
        return this.maintenanceService.updateProvider(id, dto);
    }

    @Delete('providers/:id')
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin deletes a service provider' })
    deleteProvider(@Param('id') id: string) {
        return this.maintenanceService.deleteProvider(id);
    }

    // ─── Maintenance Items ──────────────────────────────────────────────────────

    @Post('items')
    @Auth(UserRole.ADMIN, UserRole.LANDLORD)
    @ApiOperation({ summary: 'Create a maintenance item for a property' })
    createItem(@Body() dto: CreateMaintenanceItemDto, @User() user: any) {
        return this.maintenanceService.createItem(dto, user.id, user.role);
    }

    @Get('items')
    @Auth(UserRole.ADMIN, UserRole.LANDLORD)
    @ApiOperation({ summary: 'List maintenance items (optionally filter by property)' })
    listItems(
        @Query('propertyId') propertyId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.maintenanceService.listItems(
            propertyId,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
        );
    }

    @Patch('items/:id')
    @Auth(UserRole.ADMIN, UserRole.LANDLORD)
    @ApiOperation({ summary: 'Update a maintenance item' })
    updateItem(@Param('id') id: string, @Body() dto: Partial<CreateMaintenanceItemDto>) {
        return this.maintenanceService.updateItem(id, dto);
    }

    @Delete('items/:id')
    @Auth(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete a maintenance item' })
    deleteItem(@Param('id') id: string) {
        return this.maintenanceService.deleteItem(id);
    }

    // ─── Schedules ─────────────────────────────────────────────────────────────

    @Post('schedules')
    @Auth(UserRole.ADMIN, UserRole.LANDLORD)
    @ApiOperation({ summary: 'Create a maintenance schedule' })
    createSchedule(@Body() dto: CreateMaintenanceScheduleDto, @User() user: any) {
        return this.maintenanceService.createSchedule(dto, user.id, user.role);
    }

    @Get('schedules')
    @Auth(UserRole.ADMIN, UserRole.LANDLORD)
    @ApiOperation({ summary: 'List maintenance schedules' })
    listSchedules(
        @User() user: any,
        @Query('propertyId') propertyId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.maintenanceService.listSchedules(
            user.id,
            user.role,
            propertyId,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
        );
    }

    @Patch('schedules/:id')
    @Auth(UserRole.ADMIN, UserRole.LANDLORD)
    @ApiOperation({ summary: 'Update a maintenance schedule' })
    updateSchedule(
        @Param('id') id: string,
        @Body() dto: Partial<CreateMaintenanceScheduleDto>,
        @User() user: any,
    ) {
        return this.maintenanceService.updateSchedule(id, dto, user.id, user.role);
    }

    @Delete('schedules/:id')
    @Auth(UserRole.ADMIN, UserRole.LANDLORD)
    @ApiOperation({ summary: 'Delete a maintenance schedule' })
    deleteSchedule(@Param('id') id: string) {
        return this.maintenanceService.deleteSchedule(id);
    }

    // ─── Work Orders ────────────────────────────────────────────────────────────

    @Post('work-orders')
    @Auth(UserRole.ADMIN, UserRole.LANDLORD)
    @ApiOperation({ summary: 'Create a work order' })
    createWorkOrder(@Body() dto: CreateWorkOrderDto, @User() user: any) {
        return this.maintenanceService.createWorkOrder(dto, user.id, user.role);
    }

    @Get('work-orders')
    @Auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT)
    @ApiOperation({ summary: 'List work orders (role-filtered)' })
    listWorkOrders(
        @User() user: any,
        @Query('propertyId') propertyId?: string,
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.maintenanceService.listWorkOrders(user.id, user.role, {
            propertyId,
            status: status as WorkOrderStatus | undefined,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }

    @Get('work-orders/:id')
    @Auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT)
    @ApiOperation({ summary: 'Get a single work order' })
    getWorkOrder(@Param('id') id: string, @User() user: any) {
        return this.maintenanceService.getWorkOrder(id, user.id, user.role);
    }

    @Patch('work-orders/:id')
    @Auth(UserRole.ADMIN, UserRole.LANDLORD)
    @ApiOperation({ summary: 'Update work order fields (title, description, priority, etc.)' })
    updateWorkOrder(@Param('id') id: string, @Body() dto: UpdateWorkOrderDto, @User() user: any) {
        return this.maintenanceService.updateWorkOrder(id, dto, user.id, user.role);
    }

    @Delete('work-orders/:id')
    @Auth(UserRole.ADMIN, UserRole.LANDLORD)
    @ApiOperation({ summary: 'Delete a work order' })
    deleteWorkOrder(@Param('id') id: string, @User() user: any) {
        return this.maintenanceService.deleteWorkOrder(id, user.id, user.role);
    }

    @Patch('work-orders/:id/status')
    @Auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT)
    @ApiOperation({ summary: 'Update work order status' })
    updateWorkOrderStatus(
        @Param('id') id: string,
        @Body() dto: UpdateWorkOrderStatusDto,
        @User() user: any,
    ) {
        return this.maintenanceService.updateWorkOrderStatus(id, dto, user.id, user.role);
    }

    @Patch('work-orders/:id/rate')
    @Auth(UserRole.TENANT)
    @ApiOperation({ summary: 'Tenant rates a completed work order' })
    rateWorkOrder(@Param('id') id: string, @Body() dto: RateWorkOrderDto, @User() user: any) {
        return this.maintenanceService.rateWorkOrder(id, dto, user.id);
    }
}
