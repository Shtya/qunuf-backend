import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CalendarEvent } from 'src/common/entities/calendar_event.entity';
import { UserGoogleCredential } from 'src/common/entities/user_google_credential.entity';
import {
    Contract,
    ContractStatus,
} from 'src/common/entities/contract.entity';
import { RenewRequest } from 'src/common/entities/renew_request';
import { UserRole } from 'src/common/entities/user.entity';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CalendarFilterDto } from './dto/calendar-filter.dto';
import { SaveGoogleCredentialDto } from './dto/save-google-credential.dto';
import { addDays, parseISO, startOfDay } from 'date-fns';

// ─── Normalised event shape sent to the client ────────────────────────────────

export type AggregatedEventType =
    | 'contract_start'
    | 'contract_end'
    | 'contract_signed'
    | 'termination'
    | 'payment_due'
    | 'payment_made'
    | 'renewal_request'
    | 'custom'
    | 'reminder';

export interface AggregatedEvent {
    id: string;
    title: string;
    start: string;
    end: string | null;
    type: AggregatedEventType;
    status?: string;
    source: 'contract' | 'payment' | 'renewal' | 'custom';
    sourceId: string;
    url: string | null;
    metadata: Record<string, unknown>;
    color: string;
    isCustom: boolean;
}

// Color palette per event type
const EVENT_COLORS: Record<AggregatedEventType, string> = {
    contract_start: '#10B981',
    contract_end: '#EF4444',
    contract_signed: '#6366F1',
    termination: '#F59E0B',
    payment_due: '#F97316',
    payment_made: '#14B8A6',
    renewal_request: '#8B5CF6',
    custom: '#4F46E5',
    reminder: '#EC4899',
};

@Injectable()
export class CalendarService {
    constructor(
        @InjectRepository(CalendarEvent)
        private calendarEventRepo: Repository<CalendarEvent>,
        @InjectRepository(Contract)
        private contractRepo: Repository<Contract>,
        @InjectRepository(RenewRequest)
        private renewRepo: Repository<RenewRequest>,
        @InjectRepository(UserGoogleCredential)
        private googleCredRepo: Repository<UserGoogleCredential>,
    ) {}

    // ── Aggregated events ──────────────────────────────────────────────────────

    async getAggregatedEvents(
        userId: string,
        role: UserRole,
        filter: CalendarFilterDto,
    ): Promise<AggregatedEvent[]> {
        const rangeStart = filter.start
            ? parseISO(filter.start)
            : startOfDay(new Date());
        const rangeEnd = filter.end
            ? parseISO(filter.end)
            : addDays(rangeStart, 90);

        const requestedTypes = filter.types
            ? filter.types.split(',').map(t => t.trim())
            : null; // null = all types

        const wantsType = (t: AggregatedEventType) =>
            !requestedTypes || requestedTypes.includes(t);

        const events: AggregatedEvent[] = [];

        // ── 1. Contract events ─────────────────────────────────────────────────
        if (
            wantsType('contract_start') ||
            wantsType('contract_end') ||
            wantsType('contract_signed') ||
            wantsType('termination') ||
            wantsType('payment_due') ||
            wantsType('payment_made')
        ) {
            const contracts = await this.loadUserContracts(userId, role, rangeStart, rangeEnd);

            for (const c of contracts) {
                const contractUrl = `/dashboard/contracts?view=${c.id}`;

                if (wantsType('contract_start') && c.startDate) {
                    const d = new Date(c.startDate);
                    if (d >= rangeStart && d <= rangeEnd) {
                        events.push(this.buildEvent({
                            id: `contract_start_${c.id}`,
                            title: `Contract Start — ${c.propertySnapshot?.name ?? c.contractNumber ?? c.id.slice(0, 8)}`,
                            start: d.toISOString(),
                            end: null,
                            type: 'contract_start',
                            status: c.status,
                            source: 'contract',
                            sourceId: c.id,
                            url: contractUrl,
                            metadata: { contractNumber: c.contractNumber, status: c.status },
                        }));
                    }
                }

                if (wantsType('contract_end') && c.endDate) {
                    const d = new Date(c.endDate);
                    if (d >= rangeStart && d <= rangeEnd) {
                        events.push(this.buildEvent({
                            id: `contract_end_${c.id}`,
                            title: `Contract End — ${c.propertySnapshot?.name ?? c.contractNumber ?? c.id.slice(0, 8)}`,
                            start: d.toISOString(),
                            end: null,
                            type: 'contract_end',
                            status: c.status,
                            source: 'contract',
                            sourceId: c.id,
                            url: contractUrl,
                            metadata: { contractNumber: c.contractNumber, status: c.status },
                        }));
                    }
                }

                if (wantsType('contract_signed') && c.contractDate) {
                    const d = new Date(c.contractDate);
                    if (d >= rangeStart && d <= rangeEnd) {
                        events.push(this.buildEvent({
                            id: `contract_signed_${c.id}`,
                            title: `Contract Signed — ${c.propertySnapshot?.name ?? c.contractNumber ?? c.id.slice(0, 8)}`,
                            start: d.toISOString(),
                            end: null,
                            type: 'contract_signed',
                            status: c.status,
                            source: 'contract',
                            sourceId: c.id,
                            url: contractUrl,
                            metadata: { contractNumber: c.contractNumber },
                        }));
                    }
                }

                if (wantsType('termination') && c.terminationEffectiveDate) {
                    const d = new Date(c.terminationEffectiveDate);
                    if (d >= rangeStart && d <= rangeEnd) {
                        events.push(this.buildEvent({
                            id: `termination_${c.id}`,
                            title: `Termination Effective — ${c.propertySnapshot?.name ?? c.contractNumber ?? c.id.slice(0, 8)}`,
                            start: d.toISOString(),
                            end: null,
                            type: 'termination',
                            status: c.status,
                            source: 'contract',
                            sourceId: c.id,
                            url: contractUrl,
                            metadata: { contractNumber: c.contractNumber },
                        }));
                    }
                }

                // Payment installments (JSONB)
                if (Array.isArray(c.paymentSchedule)) {
                    for (let i = 0; i < c.paymentSchedule.length; i++) {
                        const inst = c.paymentSchedule[i];

                        if (wantsType('payment_due') && inst.dueDate) {
                            const d = new Date(inst.dueDate);
                            if (d >= rangeStart && d <= rangeEnd) {
                                events.push(this.buildEvent({
                                    id: `payment_due_${c.id}_${i}`,
                                    title: `Payment Due — ${c.propertySnapshot?.name ?? c.id.slice(0, 8)} (#${i + 1})`,
                                    start: d.toISOString(),
                                    end: null,
                                    type: 'payment_due',
                                    status: inst.isPaid ? 'paid' : 'pending',
                                    source: 'payment',
                                    sourceId: c.id,
                                    url: contractUrl,
                                    metadata: {
                                        amount: inst.amount,
                                        isPaid: inst.isPaid,
                                        installmentIndex: i,
                                        contractNumber: c.contractNumber,
                                    },
                                }));
                            }
                        }

                        if (wantsType('payment_made') && inst.paymentDate && inst.isPaid) {
                            const d = new Date(inst.paymentDate);
                            if (d >= rangeStart && d <= rangeEnd) {
                                events.push(this.buildEvent({
                                    id: `payment_made_${c.id}_${i}`,
                                    title: `Payment Received — ${c.propertySnapshot?.name ?? c.id.slice(0, 8)} (#${i + 1})`,
                                    start: d.toISOString(),
                                    end: null,
                                    type: 'payment_made',
                                    status: 'paid',
                                    source: 'payment',
                                    sourceId: c.id,
                                    url: contractUrl,
                                    metadata: {
                                        amount: inst.amount,
                                        installmentIndex: i,
                                        contractNumber: c.contractNumber,
                                    },
                                }));
                            }
                        }
                    }
                }
            }
        }

        // ── 2. Renewal request events ──────────────────────────────────────────
        if (wantsType('renewal_request')) {
            const renewals = await this.loadUserRenewRequests(userId, role, rangeStart, rangeEnd);
            for (const r of renewals) {
                const d = new Date(r.created_at);
                if (d >= rangeStart && d <= rangeEnd) {
                    events.push(this.buildEvent({
                        id: `renewal_${r.id}`,
                        title: `Renewal Request — ${r.originalContractId.slice(0, 8)}`,
                        start: d.toISOString(),
                        end: null,
                        type: 'renewal_request',
                        status: r.status,
                        source: 'renewal',
                        sourceId: r.id,
                        url: `/dashboard/renew-requests`,
                        metadata: { status: r.status },
                    }));
                }
            }
        }

        // ── 3. Custom user events ──────────────────────────────────────────────
        if (wantsType('custom') || wantsType('reminder')) {
            const customEvents = await this.calendarEventRepo.find({
                where: {
                    userId,
                    startDate: Between(rangeStart, rangeEnd),
                },
                order: { startDate: 'ASC' },
            });

            for (const ce of customEvents) {
                if (requestedTypes && !requestedTypes.includes(ce.eventType)) continue;
                events.push(this.buildEvent({
                    id: `custom_${ce.id}`,
                    title: ce.title,
                    start: new Date(ce.startDate).toISOString(),
                    end: ce.endDate ? new Date(ce.endDate).toISOString() : null,
                    type: ce.eventType as AggregatedEventType,
                    source: 'custom',
                    sourceId: ce.id,
                    url: ce.url,
                    metadata: { description: ce.description, allDay: ce.allDay },
                    overrideColor: ce.color ?? undefined,
                }));
            }
        }

        // Sort by start ascending
        events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        return events;
    }

    // ── Custom event CRUD ──────────────────────────────────────────────────────

    async createCustomEvent(userId: string, dto: CreateCalendarEventDto): Promise<CalendarEvent> {
        const event = this.calendarEventRepo.create({
            userId,
            title: dto.title,
            description: dto.description ?? null,
            startDate: new Date(dto.startDate),
            endDate: dto.endDate ? new Date(dto.endDate) : null,
            allDay: dto.allDay ?? false,
            color: dto.color ?? null,
            eventType: dto.eventType,
            url: dto.url ?? null,
        });
        return this.calendarEventRepo.save(event);
    }

    async updateCustomEvent(
        userId: string,
        id: string,
        dto: UpdateCalendarEventDto,
    ): Promise<CalendarEvent> {
        const event = await this.findOwnedEvent(userId, id);
        if (dto.title !== undefined) event.title = dto.title;
        if (dto.description !== undefined) event.description = dto.description;
        if (dto.startDate !== undefined) event.startDate = new Date(dto.startDate);
        if (dto.endDate !== undefined) event.endDate = dto.endDate ? new Date(dto.endDate) : null;
        if (dto.allDay !== undefined) event.allDay = dto.allDay;
        if (dto.color !== undefined) event.color = dto.color;
        if (dto.eventType !== undefined) event.eventType = dto.eventType;
        if (dto.url !== undefined) event.url = dto.url;
        return this.calendarEventRepo.save(event);
    }

    async deleteCustomEvent(userId: string, id: string): Promise<void> {
        const event = await this.findOwnedEvent(userId, id);
        await this.calendarEventRepo.softRemove(event);
    }

    // ── Google Calendar — per-user credentials ────────────────────────────────

    async getGoogleCredential(userId: string): Promise<{ clientId: string | null; hasSecret: boolean; redirectUri: string }> {
        const cred = await this.googleCredRepo.findOne({ where: { userId } });
        return {
            clientId: cred?.clientId ?? null,
            hasSecret: !!cred,
            redirectUri: process.env.GOOGLE_REDIRECT_URI ?? '',
        };
    }

    async saveGoogleCredential(userId: string, dto: SaveGoogleCredentialDto): Promise<void> {
        let cred = await this.googleCredRepo.findOne({ where: { userId } });
        if (cred) {
            cred.clientId = dto.clientId;
            cred.clientSecret = dto.clientSecret;
            await this.googleCredRepo.save(cred);
        } else {
            await this.googleCredRepo.save(
                this.googleCredRepo.create({ userId, clientId: dto.clientId, clientSecret: dto.clientSecret }),
            );
        }
    }

    async deleteGoogleCredential(userId: string): Promise<void> {
        const cred = await this.googleCredRepo.findOne({ where: { userId } });
        if (cred) await this.googleCredRepo.softRemove(cred);
    }

    async getGoogleAuthUrl(userId: string): Promise<{ url: string; configured: boolean }> {
        const cred = await this.googleCredRepo.findOne({ where: { userId } });
        const redirectUri = process.env.GOOGLE_REDIRECT_URI;

        if (!cred || !redirectUri) {
            return { url: '', configured: false };
        }

        const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        url.searchParams.set('client_id', cred.clientId);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.events');
        url.searchParams.set('access_type', 'offline');
        url.searchParams.set('prompt', 'consent');
        url.searchParams.set('state', userId);

        return { url: url.toString(), configured: true };
    }

    // ── Internal helpers ───────────────────────────────────────────────────────

    private async loadUserContracts(
        userId: string,
        role: UserRole,
        rangeStart: Date,
        rangeEnd: Date,
    ): Promise<Contract[]> {
        const qb = this.contractRepo
            .createQueryBuilder('c')
            .where('c.deleted_at IS NULL')
            .andWhere('c.status NOT IN (:...ignored)', {
                ignored: [ContractStatus.DRAFT, ContractStatus.CANCELLED],
            });

        if (role === UserRole.TENANT) {
            qb.andWhere('c.tenant_id = :userId', { userId });
        } else if (role === UserRole.LANDLORD) {
            qb.andWhere('c.landlord_id = :userId', { userId });
        }
        // Admin sees all

        return qb.getMany();
    }

    private async loadUserRenewRequests(
        userId: string,
        role: UserRole,
        rangeStart: Date,
        rangeEnd: Date,
    ): Promise<RenewRequest[]> {
        const qb = this.renewRepo
            .createQueryBuilder('r')
            .where('r.deleted_at IS NULL')
            .andWhere('r.created_at BETWEEN :start AND :end', {
                start: rangeStart,
                end: rangeEnd,
            });

        if (role === UserRole.TENANT) {
            qb.andWhere('r.tenant_id = :userId', { userId });
        }
        // Admin and Landlord see all for now

        return qb.getMany();
    }

    private async findOwnedEvent(userId: string, id: string): Promise<CalendarEvent> {
        const event = await this.calendarEventRepo.findOne({ where: { id } });
        if (!event) throw new NotFoundException('Calendar event not found');
        if (event.userId !== userId) throw new ForbiddenException('Not your event');
        return event;
    }

    private buildEvent(params: {
        id: string;
        title: string;
        start: string;
        end: string | null;
        type: AggregatedEventType;
        status?: string;
        source: AggregatedEvent['source'];
        sourceId: string;
        url: string | null;
        metadata: Record<string, unknown>;
        overrideColor?: string;
    }): AggregatedEvent {
        return {
            id: params.id,
            title: params.title,
            start: params.start,
            end: params.end,
            type: params.type,
            status: params.status,
            source: params.source,
            sourceId: params.sourceId,
            url: params.url,
            metadata: params.metadata,
            color: params.overrideColor ?? EVENT_COLORS[params.type] ?? '#4F46E5',
            isCustom: params.source === 'custom',
        };
    }
}
