import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { ServiceProvider, ProviderStatus } from 'src/common/entities/service-provider.entity';
import { MaintenanceItem } from 'src/common/entities/maintenance-item.entity';
import { MaintenanceSchedule, RecurrenceType, ScheduleStatus } from 'src/common/entities/maintenance-schedule.entity';
import { WorkOrder, WorkOrderStatus } from 'src/common/entities/work-order.entity';
import { Property } from 'src/common/entities/property.entity';
import { User, UserRole } from 'src/common/entities/user.entity';
import { CalendarEvent, CalendarEventType } from 'src/common/entities/calendar_event.entity';
import { Contract, ContractStatus } from 'src/common/entities/contract.entity';
import { NotificationService } from '../notification/notification.service';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';
import { CreateMaintenanceItemDto } from './dto/create-maintenance-item.dto';
import { CreateMaintenanceScheduleDto } from './dto/create-maintenance-schedule.dto';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderStatusDto, RateWorkOrderDto, UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

@Injectable()
export class MaintenanceService {
    constructor(
        @InjectRepository(ServiceProvider)
        private providerRepo: Repository<ServiceProvider>,

        @InjectRepository(MaintenanceItem)
        private itemRepo: Repository<MaintenanceItem>,

        @InjectRepository(MaintenanceSchedule)
        private scheduleRepo: Repository<MaintenanceSchedule>,

        @InjectRepository(WorkOrder)
        private workOrderRepo: Repository<WorkOrder>,

        @InjectRepository(Property)
        private propertyRepo: Repository<Property>,

        @InjectRepository(User)
        private userRepo: Repository<User>,

        @InjectRepository(CalendarEvent)
        private calendarEventRepo: Repository<CalendarEvent>,

        @InjectRepository(Contract)
        private contractRepo: Repository<Contract>,

        private notificationService: NotificationService,
    ) {}

    // ─── Service Providers ─────────────────────────────────────────────────────

    async createProvider(dto: CreateServiceProviderDto): Promise<ServiceProvider> {
        const provider = this.providerRepo.create(dto);
        return this.providerRepo.save(provider);
    }

    async listProviders(page = 1, limit = 20, search?: string, status?: ProviderStatus) {
        const where: FindOptionsWhere<ServiceProvider> = {};
        if (status) where.status = status;

        const qb = this.providerRepo.createQueryBuilder('p');
        if (search) qb.andWhere('p.name ILIKE :search OR p.email ILIKE :search', { search: `%${search}%` });
        if (status) qb.andWhere('p.status = :status', { status });

        const [data, total] = await qb
            .orderBy('p.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { data, total, page, limit };
    }

    async updateProvider(id: string, dto: UpdateServiceProviderDto): Promise<ServiceProvider> {
        const provider = await this.providerRepo.findOne({ where: { id } });
        if (!provider) throw new NotFoundException('Service provider not found');
        Object.assign(provider, dto);
        return this.providerRepo.save(provider);
    }

    async deleteProvider(id: string): Promise<void> {
        const provider = await this.providerRepo.findOne({ where: { id } });
        if (!provider) throw new NotFoundException('Service provider not found');
        await this.providerRepo.softDelete(id);
    }

    // ─── Maintenance Items ──────────────────────────────────────────────────────

    async createItem(dto: CreateMaintenanceItemDto, userId: string, userRole: UserRole): Promise<MaintenanceItem> {
        const property = await this.propertyRepo.findOne({ where: { id: dto.propertyId } });
        if (!property) throw new NotFoundException('Property not found');

        if (userRole === UserRole.LANDLORD && property.userId !== userId) {
            throw new ForbiddenException('You do not own this property');
        }

        const item = this.itemRepo.create(dto);
        return this.itemRepo.save(item);
    }

    async listItems(propertyId?: string, page = 1, limit = 20) {
        const qb = this.itemRepo.createQueryBuilder('i').leftJoinAndSelect('i.property', 'property');
        if (propertyId) qb.andWhere('i.property_id = :propertyId', { propertyId });

        const [data, total] = await qb
            .orderBy('i.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { data, total, page, limit };
    }

    async updateItem(id: string, dto: Partial<CreateMaintenanceItemDto>): Promise<MaintenanceItem> {
        const item = await this.itemRepo.findOne({ where: { id } });
        if (!item) throw new NotFoundException('Maintenance item not found');
        Object.assign(item, dto);
        return this.itemRepo.save(item);
    }

    async deleteItem(id: string): Promise<void> {
        const item = await this.itemRepo.findOne({ where: { id } });
        if (!item) throw new NotFoundException('Maintenance item not found');
        await this.itemRepo.softDelete(id);
    }

    // ─── Maintenance Schedules ──────────────────────────────────────────────────

    async createSchedule(dto: CreateMaintenanceScheduleDto, userId: string, userRole: UserRole): Promise<MaintenanceSchedule> {
        const property = await this.propertyRepo.findOne({ where: { id: dto.propertyId } });
        if (!property) throw new NotFoundException('Property not found');

        if (userRole === UserRole.LANDLORD && property.userId !== userId) {
            throw new ForbiddenException('You do not own this property');
        }

        const startDate = new Date(dto.startDate);
        const nextRunDate = this.computeNextRunDate(startDate, dto.recurrenceType, dto.recurrenceInterval);

        const schedule = this.scheduleRepo.create({
            ...dto,
            startDate,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            nextRunDate,
            createdById: userId,
        });

        const saved = await this.scheduleRepo.save(schedule);

        // Notify admin when landlord creates a schedule
        if (userRole === UserRole.LANDLORD) {
            const admin = await this.userRepo.findOne({ where: { role: UserRole.ADMIN } });
            if (admin) {
                await this.notificationService.createNotification(
                    admin.id,
                    'MAINTENANCE_SCHEDULE_CREATED',
                    'New Maintenance Schedule',
                    `A new maintenance schedule "${dto.title}" was created for property ${property.name}`,
                    'maintenance_schedule',
                    saved.id,
                );
            }
        }

        return saved;
    }

    async listSchedules(userId: string, userRole: UserRole, propertyId?: string, page = 1, limit = 20) {
        const qb = this.scheduleRepo
            .createQueryBuilder('s')
            .leftJoinAndSelect('s.property', 'property')
            .leftJoinAndSelect('s.maintenanceItem', 'maintenanceItem')
            .leftJoinAndSelect('s.provider', 'provider');

        if (userRole === UserRole.LANDLORD) {
            qb.andWhere('property.user_id = :userId', { userId });
        }
        if (propertyId) qb.andWhere('s.property_id = :propertyId', { propertyId });

        const [data, total] = await qb
            .orderBy('s.next_run_date', 'ASC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { data, total, page, limit };
    }

    async updateSchedule(id: string, dto: Partial<CreateMaintenanceScheduleDto>, userId: string, userRole: UserRole): Promise<MaintenanceSchedule> {
        const schedule = await this.scheduleRepo.findOne({ where: { id }, relations: ['property'] });
        if (!schedule) throw new NotFoundException('Schedule not found');

        if (userRole === UserRole.LANDLORD && schedule.property.userId !== userId) {
            throw new ForbiddenException('You do not own this property');
        }

        if (dto.startDate || dto.recurrenceType || dto.recurrenceInterval) {
            const base = dto.startDate ? new Date(dto.startDate) : schedule.startDate;
            const type = dto.recurrenceType ?? schedule.recurrenceType;
            const interval = dto.recurrenceInterval ?? schedule.recurrenceInterval;
            schedule.nextRunDate = this.computeNextRunDate(base, type, interval);
        }

        Object.assign(schedule, dto);
        return this.scheduleRepo.save(schedule);
    }

    async deleteSchedule(id: string): Promise<void> {
        const schedule = await this.scheduleRepo.findOne({ where: { id } });
        if (!schedule) throw new NotFoundException('Schedule not found');
        await this.scheduleRepo.softDelete(id);
    }

    // ─── Work Orders ────────────────────────────────────────────────────────────

    async createWorkOrder(dto: CreateWorkOrderDto, userId: string, userRole: UserRole): Promise<WorkOrder> {
        const property = await this.propertyRepo.findOne({ where: { id: dto.propertyId } });
        if (!property) throw new NotFoundException('Property not found');

        if (userRole === UserRole.LANDLORD && property.userId !== userId) {
            throw new ForbiddenException('You do not own this property');
        }

        // Auto-find active tenant from contracts if not explicitly provided
        let assignedTenantId = dto.assignedTenantId;
        if (!assignedTenantId) {
            const activeContract = await this.contractRepo.findOne({
                where: { propertyId: dto.propertyId, status: ContractStatus.ACTIVE },
            });
            if (activeContract) assignedTenantId = activeContract.tenantId;
        }

        // If isRecurring, create a MaintenanceSchedule first and link it
        let scheduleId = dto.scheduleId;
        if (dto.isRecurring && dto.recurrenceType) {
            const startDate = dto.dueDate ? new Date(dto.dueDate) : new Date();
            const schedule = this.scheduleRepo.create({
                propertyId: dto.propertyId,
                title: dto.title,
                description: dto.description,
                recurrenceType: dto.recurrenceType,
                recurrenceInterval: dto.recurrenceInterval ?? 1,
                startDate,
                endDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : undefined,
                nextRunDate: this.computeNextRunDate(startDate, dto.recurrenceType, dto.recurrenceInterval ?? 1),
                createdById: userId,
                providerId: dto.providerId,
            });
            const savedSchedule = await this.scheduleRepo.save(schedule);
            scheduleId = savedSchedule.id;
        }

        const workOrder = this.workOrderRepo.create({
            propertyId: dto.propertyId,
            title: dto.title,
            description: dto.description,
            priority: dto.priority,
            category: dto.category,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
            providerId: dto.providerId,
            scheduleId,
            assignedTenantId,
            createdById: userId,
            status: WorkOrderStatus.SCHEDULED,
        });

        const saved = await this.workOrderRepo.save(workOrder);

        // Calendar events — for creator and tenant if due date is set
        if (dto.dueDate) {
            const dueDate = new Date(dto.dueDate);
            const calendarTitle = `🔧 ${dto.title} — ${property.name}`;
            const calendarDesc = dto.description ?? null;
            const maintenanceUrl = `/dashboard/maintenance?workOrder=${saved.id}`;

            await this.calendarEventRepo.save(this.calendarEventRepo.create({
                userId,
                title: calendarTitle,
                description: calendarDesc,
                startDate: dueDate,
                endDate: null,
                eventType: CalendarEventType.MAINTENANCE,
                color: '#F59E0B',
                url: maintenanceUrl,
            }));

            // Also create for landlord if admin created
            if (userRole === UserRole.ADMIN && property.userId !== userId) {
                await this.calendarEventRepo.save(this.calendarEventRepo.create({
                    userId: property.userId,
                    title: calendarTitle,
                    description: calendarDesc,
                    startDate: dueDate,
                    endDate: null,
                    eventType: CalendarEventType.MAINTENANCE,
                    color: '#F59E0B',
                    url: maintenanceUrl,
                }));
            }

            // Calendar event for tenant
            if (assignedTenantId) {
                await this.calendarEventRepo.save(this.calendarEventRepo.create({
                    userId: assignedTenantId,
                    title: calendarTitle,
                    description: calendarDesc,
                    startDate: dueDate,
                    endDate: null,
                    eventType: CalendarEventType.MAINTENANCE,
                    color: '#F59E0B',
                    url: maintenanceUrl,
                }));
            }
        }

        // Notifications — notify BOTH admin and landlord
        const notifyMsg = `A new work order "${dto.title}" was created for property "${property.name}"`;

        if (userRole !== UserRole.ADMIN) {
            // Notify admin when landlord creates
            const admin = await this.userRepo.findOne({ where: { role: UserRole.ADMIN } });
            if (admin) {
                await this.notificationService.createNotification(
                    admin.id,
                    'WORK_ORDER_CREATED',
                    'New Work Order',
                    notifyMsg,
                    'work_order',
                    saved.id,
                );
            }
        }

        if (userRole !== UserRole.LANDLORD && property.userId !== userId) {
            // Notify landlord when admin creates
            await this.notificationService.createNotification(
                property.userId,
                'WORK_ORDER_CREATED',
                'New Work Order',
                notifyMsg,
                'work_order',
                saved.id,
            );
        }

        // Always notify assigned tenant
        if (assignedTenantId) {
            await this.notificationService.createNotification(
                assignedTenantId,
                'WORK_ORDER_TENANT_NOTIFICATION',
                'Maintenance Scheduled',
                `Maintenance work "${dto.title}" has been scheduled for your unit in "${property.name}"`,
                'work_order',
                saved.id,
            );
        }

        return this.workOrderRepo.findOne({
            where: { id: saved.id },
            relations: ['property', 'provider', 'createdBy'],
        });
    }

    async updateWorkOrder(id: string, dto: UpdateWorkOrderDto, userId: string, userRole: UserRole): Promise<WorkOrder> {
        const workOrder = await this.workOrderRepo.findOne({ where: { id }, relations: ['property'] });
        if (!workOrder) throw new NotFoundException('Work order not found');

        if (userRole === UserRole.LANDLORD && workOrder.property.userId !== userId) {
            throw new ForbiddenException('You do not own this property');
        }

        if (dto.dueDate !== undefined) {
            workOrder.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
        }
        if (dto.title !== undefined) workOrder.title = dto.title;
        if (dto.description !== undefined) workOrder.description = dto.description;
        if (dto.priority !== undefined) workOrder.priority = dto.priority;
        if (dto.category !== undefined) workOrder.category = dto.category;
        if (dto.providerId !== undefined) workOrder.providerId = dto.providerId || null;
        if (dto.notes !== undefined) workOrder.notes = dto.notes;

        return this.workOrderRepo.save(workOrder);
    }

    async deleteWorkOrder(id: string, userId: string, userRole: UserRole): Promise<void> {
        const workOrder = await this.workOrderRepo.findOne({ where: { id }, relations: ['property'] });
        if (!workOrder) throw new NotFoundException('Work order not found');

        if (userRole === UserRole.LANDLORD && workOrder.property.userId !== userId) {
            throw new ForbiddenException('You do not own this property');
        }

        await this.workOrderRepo.softDelete(id);
    }

    async listWorkOrders(userId: string, userRole: UserRole, filters: {
        propertyId?: string;
        status?: WorkOrderStatus;
        page?: number;
        limit?: number;
    }) {
        const { propertyId, status, page = 1, limit = 20 } = filters;

        const qb = this.workOrderRepo
            .createQueryBuilder('w')
            .leftJoinAndSelect('w.property', 'property')
            .leftJoinAndSelect('w.provider', 'provider')
            .leftJoinAndSelect('w.createdBy', 'createdBy')
            .leftJoinAndSelect('w.assignedTenant', 'assignedTenant');

        if (userRole === UserRole.LANDLORD) {
            qb.andWhere('property.user_id = :userId', { userId });
        } else if (userRole === UserRole.TENANT) {
            qb.andWhere('w.assigned_tenant_id = :userId', { userId });
        }

        if (propertyId) qb.andWhere('w.property_id = :propertyId', { propertyId });
        if (status) qb.andWhere('w.status = :status', { status });

        const [data, total] = await qb
            .orderBy('w.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { data, total, page, limit };
    }

    async getWorkOrder(id: string, userId: string, userRole: UserRole): Promise<WorkOrder> {
        const workOrder = await this.workOrderRepo.findOne({
            where: { id },
            relations: ['property', 'provider', 'createdBy', 'schedule', 'assignedTenant'],
        });

        if (!workOrder) throw new NotFoundException('Work order not found');

        if (userRole === UserRole.LANDLORD && workOrder.property.userId !== userId) {
            throw new ForbiddenException('You do not own this property');
        }
        if (userRole === UserRole.TENANT && workOrder.assignedTenantId !== userId) {
            throw new ForbiddenException('You are not assigned to this work order');
        }

        return workOrder;
    }

    async updateWorkOrderStatus(id: string, dto: UpdateWorkOrderStatusDto, userId: string, userRole: UserRole): Promise<WorkOrder> {
        const workOrder = await this.workOrderRepo.findOne({
            where: { id },
            relations: ['property', 'provider'],
        });

        if (!workOrder) throw new NotFoundException('Work order not found');

        if (userRole === UserRole.LANDLORD && workOrder.property.userId !== userId) {
            throw new ForbiddenException('You do not own this property');
        }

        if (userRole === UserRole.TENANT) {
            if (workOrder.assignedTenantId !== userId) {
                throw new ForbiddenException('You are not assigned to this work order');
            }
            const tenantAllowed: WorkOrderStatus[] = [
                WorkOrderStatus.IN_PROGRESS,
                WorkOrderStatus.COMPLETED,
                WorkOrderStatus.SCHEDULED,
            ];
            if (!tenantAllowed.includes(dto.status)) {
                throw new BadRequestException('Invalid status for tenant');
            }
            // Mark access approved whenever tenant actively reports the provider was there
            if (dto.status === WorkOrderStatus.IN_PROGRESS || dto.status === WorkOrderStatus.COMPLETED) {
                workOrder.tenantAccessApproved = true;
            }
            // Tenant reports no-show — notify admin and landlord
            if (dto.status === WorkOrderStatus.SCHEDULED) {
                const admin = await this.userRepo.findOne({ where: { role: UserRole.ADMIN } });
                const msg = `Tenant reported provider did not show up for work order "${workOrder.title}"`;
                if (admin) {
                    await this.notificationService.createNotification(
                        admin.id, 'WORK_ORDER_NO_SHOW', 'Provider No-Show', msg, 'work_order', workOrder.id,
                    );
                }
                if (workOrder.property?.userId && workOrder.property.userId !== admin?.id) {
                    await this.notificationService.createNotification(
                        workOrder.property.userId, 'WORK_ORDER_NO_SHOW', 'Provider No-Show', msg, 'work_order', workOrder.id,
                    );
                }
            }
        }

        if (dto.status === WorkOrderStatus.COMPLETED) {
            workOrder.completedDate = new Date();
        }

        Object.assign(workOrder, dto);
        const saved = await this.workOrderRepo.save(workOrder);

        await this.dispatchStatusNotification(saved, userRole);

        return saved;
    }

    async tenantApproveAccess(id: string, userId: string): Promise<WorkOrder> {
        const workOrder = await this.workOrderRepo.findOne({
            where: { id, assignedTenantId: userId },
        });
        if (!workOrder) throw new NotFoundException('Work order not found or not assigned to you');

        workOrder.tenantAccessApproved = true;
        // Approving access means the provider is entering the unit — move to in_progress
        if (workOrder.status === WorkOrderStatus.SCHEDULED || workOrder.status === WorkOrderStatus.OVERDUE) {
            workOrder.status = WorkOrderStatus.IN_PROGRESS;
        }
        const saved = await this.workOrderRepo.save(workOrder);

        if (saved.createdById) {
            await this.notificationService.createNotification(
                saved.createdById,
                'WORK_ORDER_ACCESS_APPROVED',
                'Tenant Approved Access',
                `Tenant approved access for work order "${saved.title}"`,
                'work_order',
                saved.id,
            );
        }

        return saved;
    }

    async rateWorkOrder(id: string, dto: RateWorkOrderDto, userId: string): Promise<WorkOrder> {
        const workOrder = await this.workOrderRepo.findOne({
            where: { id, assignedTenantId: userId },
        });
        if (!workOrder) throw new NotFoundException('Work order not found or not assigned to you');
        if (workOrder.status !== WorkOrderStatus.COMPLETED) {
            throw new BadRequestException('Can only rate completed work orders');
        }

        workOrder.tenantRating = dto.rating;
        workOrder.tenantRatingComment = dto.comment;
        workOrder.status = WorkOrderStatus.CLOSED;

        const saved = await this.workOrderRepo.save(workOrder);

        // Update provider average rating
        if (saved.providerId) {
            await this.recalcProviderRating(saved.providerId);
        }

        return saved;
    }

    // ─── Overdue Detection (called by background service) ──────────────────────

    async markOverdueWorkOrders(): Promise<number> {
        const now = new Date();
        const result = await this.workOrderRepo
            .createQueryBuilder()
            .update(WorkOrder)
            .set({ status: WorkOrderStatus.OVERDUE })
            .where('due_date < :now', { now })
            .andWhere('status IN (:...active)', {
                active: [WorkOrderStatus.SCHEDULED, WorkOrderStatus.IN_PROGRESS],
            })
            .execute();

        return result.affected ?? 0;
    }

    async sendUpcomingReminders(): Promise<void> {
        const schedules = await this.scheduleRepo.find({
            where: { status: ScheduleStatus.ACTIVE },
            relations: ['property', 'createdBy'],
        });

        const now = new Date();

        for (const schedule of schedules) {
            if (!schedule.notificationDaysBefore || !schedule.nextRunDate) continue;

            for (const daysBefore of schedule.notificationDaysBefore) {
                const reminderDate = addDays(now, daysBefore);
                const nextRun = new Date(schedule.nextRunDate);

                const sameDay =
                    reminderDate.getFullYear() === nextRun.getFullYear() &&
                    reminderDate.getMonth() === nextRun.getMonth() &&
                    reminderDate.getDate() === nextRun.getDate();

                if (sameDay && schedule.createdById) {
                    await this.notificationService.createNotification(
                        schedule.createdById,
                        'MAINTENANCE_REMINDER',
                        'Upcoming Maintenance Reminder',
                        `Maintenance "${schedule.title}" is scheduled in ${daysBefore} day(s) for property "${schedule.property?.name}"`,
                        'maintenance_schedule',
                        schedule.id,
                    );
                }
            }
        }
    }

    async advanceRecurringSchedules(): Promise<void> {
        const now = new Date();
        const due = await this.scheduleRepo
            .createQueryBuilder('s')
            .where('s.next_run_date <= :now', { now })
            .andWhere('s.status = :status', { status: ScheduleStatus.ACTIVE })
            .andWhere('s.recurrence_type != :once', { once: RecurrenceType.ONCE })
            .getMany();

        for (const schedule of due) {
            schedule.nextRunDate = this.computeNextRunDate(
                new Date(schedule.nextRunDate),
                schedule.recurrenceType,
                schedule.recurrenceInterval,
            );

            if (schedule.endDate && schedule.nextRunDate > new Date(schedule.endDate)) {
                schedule.status = ScheduleStatus.COMPLETED;
            }

            await this.scheduleRepo.save(schedule);
        }
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private computeNextRunDate(base: Date, type: RecurrenceType, interval = 1): Date {
        switch (type) {
            case RecurrenceType.DAILY:    return addDays(base, interval);
            case RecurrenceType.WEEKLY:   return addWeeks(base, interval);
            case RecurrenceType.MONTHLY:  return addMonths(base, interval);
            case RecurrenceType.ANNUALLY: return addYears(base, interval);
            default:                      return base;
        }
    }

    private async recalcProviderRating(providerId: string): Promise<void> {
        const result = await this.workOrderRepo
            .createQueryBuilder('w')
            .select('AVG(w.tenant_rating)', 'avg')
            .where('w.provider_id = :providerId', { providerId })
            .andWhere('w.tenant_rating IS NOT NULL')
            .getRawOne<{ avg: string }>();

        const avg = result?.avg ? parseFloat(result.avg) : null;
        await this.providerRepo.update(providerId, { averageRating: avg });
    }

    private async dispatchStatusNotification(workOrder: WorkOrder, actorRole: UserRole): Promise<void> {
        const notifyUserId = actorRole === UserRole.ADMIN ? workOrder.property?.userId : null;
        if (!notifyUserId) return;

        const messages: Partial<Record<WorkOrderStatus, string>> = {
            [WorkOrderStatus.IN_PROGRESS]: `Work order "${workOrder.title}" is now in progress`,
            [WorkOrderStatus.COMPLETED]: `Work order "${workOrder.title}" has been completed`,
            [WorkOrderStatus.CANCELLED]: `Work order "${workOrder.title}" was cancelled`,
        };

        const msg = messages[workOrder.status];
        if (msg) {
            await this.notificationService.createNotification(
                notifyUserId,
                'WORK_ORDER_STATUS_UPDATED',
                'Work Order Update',
                msg,
                'work_order',
                workOrder.id,
            );
        }

        if (workOrder.assignedTenantId && workOrder.status === WorkOrderStatus.IN_PROGRESS) {
            await this.notificationService.createNotification(
                workOrder.assignedTenantId,
                'WORK_ORDER_IN_PROGRESS',
                'Maintenance In Progress',
                `Maintenance work "${workOrder.title}" has started in your unit`,
                'work_order',
                workOrder.id,
            );
        }
    }
}
