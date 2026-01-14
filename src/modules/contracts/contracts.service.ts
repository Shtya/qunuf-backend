import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, Repository } from 'typeorm';
import { CreateContractDto } from './dto/create-contract.dto';
import { Contract, ContractStatus, PaymentInstallment, PropertySnapshot, UserSnapshot } from 'src/common/entities/contract.entity';
import { Property, PropertyType, RentType } from 'src/common/entities/property.entity';
import { IdentityType, User, UserRole, UserStatus } from 'src/common/entities/user.entity';
import { Settings } from 'src/common/entities/settings.entity';
import { IBulkNotificationPayload, NotificationService } from '../notification/notification.service';
import { addDays, differenceInDays, parseISO } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';
import { trimText } from 'src/common/utils/helpers';
import { AcceptContractDto } from './dto/accept-contract-dto';
import { ContractFilterDto } from './dto/contract-filter.dto';
import { CRUD } from 'src/common/services/crud.service';
import { RenewRequest, RenewStatus } from 'src/common/entities/renew_request';
import { RenewFilterDto } from './dto/renew_filter.dto';
import { ContractDataMasker } from 'src/common/utils/contractDataMasker';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Property)
    private propertyRepo: Repository<Property>,
    @InjectRepository(Settings)
    private settingsRepo: Repository<Settings>,
    @InjectRepository(RenewRequest)
    private renewRepo: Repository<RenewRequest>,
    private notificationService: NotificationService,
    private dataSource: DataSource,
  ) { }

  private readonly RENT_MONTH_DAYS = 30
  private readonly MAX_RENT_YEAR_RESIDENTIAL = 1
  private readonly MAX_RENT_YEAR_COMMERCIAL = 5

  async create(tenantId: string, dto: CreateContractDto) {
    const tenant = await this.userRepo.findOne({
      where: { id: tenantId },
      relations: ['nationality', 'identityIssueCountry']
      //'address', 
    });
    // 1. Fetch tenant 
    if (!tenant) throw new NotFoundException('Tenant not found');
    this.validateTenantProfile(tenant);

    // 2. Fetch Property 
    const property = await this.propertyRepo.findOne({
      where: { id: dto.propertyId },
      relations: ['state'] // needed for snapshot
    });
    if (!property) throw new NotFoundException('Property not found');

    // 3. Fetch Landlord (Owner of property)
    const landlordId = property.userId;
    if (!landlordId) throw new BadRequestException('Property has no assigned landlord');
    const landlord = await this.userRepo.findOne({
      where: { id: landlordId },
      relations: ['nationality', 'identityIssueCountry']
    }
    );
    if (!landlord) throw new NotFoundException('Landlord not found');

    // 4. Validate Duration (Residential Max 1 Years, Commercial Max 5 Years)
    const start = new Date(dto.startDate);
    start.setHours(0, 0, 0, 0);
    const duration = dto.duration ?? 1;
    let end: Date;
    let durationInMonths: number;
    let durationInYears: number;
    let oneYearRentAmount: number;

    // 🔹 Minimum validation (always months-based)


    if (property.rentType === RentType.MONTHLY) {
      // duration = months
      durationInMonths = duration;
      durationInYears = duration / 12;
      end = addDays(start, durationInMonths * this.RENT_MONTH_DAYS);
    } else {
      //duration = years
      durationInYears = duration;
      durationInMonths = duration * 12;
      end = addDays(start, durationInMonths * this.RENT_MONTH_DAYS);
    }
    // 🔹 Max based on property type
    if (
      property.propertyType === PropertyType.RESIDENTIAL &&
      durationInYears > this.MAX_RENT_YEAR_RESIDENTIAL
    ) {
      throw new BadRequestException(`Residential contracts cannot exceed ${this.MAX_RENT_YEAR_RESIDENTIAL} year`);
    }

    if (
      property.propertyType === PropertyType.COMMERCIAL &&
      durationInYears > this.MAX_RENT_YEAR_COMMERCIAL
    ) {
      throw new BadRequestException(`Commercial contracts cannot exceed ${this.MAX_RENT_YEAR_COMMERCIAL} years`);
    }

    // 5. Fetch Global Settings for Default Terms
    const settings = await this.settingsRepo.findOne({ where: {} });
    const defaultTerms = settings?.defaultContractTerms || '';

    // 6. Create Snapshots
    const tenantSnapshot = this.mapUserSnapshot(tenant);
    const landlordSnapshot = this.mapUserSnapshot(landlord);
    const propertySnapshot = this.mapPropertySnapshot(property);

    // 7. Calculate Financials (Simplistic logic - expand as needed)
    let totalAmount;
    const basePrice = Number(property.rentPrice);
    if (property.rentType === RentType.MONTHLY) {
      oneYearRentAmount = basePrice * Math.min(durationInMonths, 12);
      totalAmount = basePrice * durationInMonths;
    } else {
      oneYearRentAmount = basePrice * Math.min(durationInYears, 1);
      totalAmount = basePrice * durationInYears;
    }

    // 8. Create Contract Entity
    const contract = this.contractRepo.create({
      tenantId: tenant.id,
      landlordId: landlord.id,
      propertyId: property.id,
      startDate: start,
      endDate: end,
      durationInMonths: durationInMonths,

      // Financials
      totalAmount: totalAmount,
      securityDeposit: property.securityDeposit,
      rentType: property.rentType,
      paymentSchedule: this.generatePaymentSchedule(
        property.rentType,
        start,
        durationInMonths,
        durationInYears,
        basePrice
      ),
      // Snapshots
      tenantSnapshot,
      landlordSnapshot,
      propertySnapshot,

      // Terms
      originalTerms: defaultTerms,
      currentTerms: dto.proposedTerms || defaultTerms, // Tenant might have sent edits immediately

      platformFeePercentage: settings?.platformPercent,
      platformFeeAmount: (settings?.platformPercent ?? 2.5 / 100) * oneYearRentAmount,
      // Status: Waiting for Landlord
      status: ContractStatus.PENDING_LANDLORD_ACCEPTANCE
    });

    const savedContract = await this.contractRepo.save(contract);
    const admin = await this.userRepo.findOne({
      where: { role: UserRole.ADMIN },
      order: { id: 'ASC' }, // ensures first one
      select: ['id'],
    })
    // 9. Send Notifications
    const notifications = [
      {
        userId: landlord.id,
        type: 'CONTRACT_REQUEST',
        title: 'New Contract Request',
        message: `You have a new contract request from ${tenant.name} for ${property.name}.`,
        relatedEntityType: 'contract',
        relatedEntityId: savedContract.id,
      },
      {
        userId: tenant.id,
        type: 'CONTRACT_CREATED',
        title: 'Contract Sent',
        message: 'Your contract request has been sent to the landlord for approval.',
        relatedEntityType: 'contract',
        relatedEntityId: savedContract.id,
      }
    ];

    // Add the Admin notification if an admin was found
    if (admin) {
      notifications.push({
        userId: admin.id,
        type: 'ADMIN_CONTRACT_ALERT',
        title: 'New Tenant Proposal',
        message: `Landlord ${landlord.name} received a new contract request for property "${property.name}" and is awaiting their approval.`,
        relatedEntityType: 'contract',
        relatedEntityId: savedContract.id,
      });
    }

    await this.notificationService.sendBulkNotificationWithPayload(notifications);

    return ContractDataMasker.mask(savedContract, tenant.role);
  }

  private validateTenantProfile(user: User) {
    const missingFields: string[] = [];
    // Check all sensitive fields required for Ejar
    if (!user.nationalityId) missingFields.push('Nationality');
    if (!user.identityType) missingFields.push('Identity Type');
    if (!user.identityNumber) missingFields.push('Identity Number');
    if (!user.identityIssueCountryId) missingFields.push('Identity Issue Country');
    if (!user.birthDate) missingFields.push('Birth Date');
    if (!user.phoneNumber) missingFields.push('Phone Number');
    if (!user.shortAddress) missingFields.push('National Short Address');
    if (user.identityType === IdentityType.OTHER && !user.identityOtherType)
      missingFields.push('Identity Other Type');
    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Please complete your profile first. Missing: ${missingFields.join(', ')}`
      );
    }
  }

  private mapUserSnapshot(user: User): UserSnapshot {
    return {
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      nationality: user.nationality?.name || 'Unknown', // Access relation
      identityType: user.identityType || '',
      identityNumber: user.identityNumber || '',
      identityIssueCountry: user.identityIssueCountry?.name || 'Unknown',
      identityOtherType: user.identityOtherType,
      birthDate: user.birthDate ? user.birthDate.toISOString() : '',
      shortAddress: user.shortAddress || ''
    };
  }

  private mapPropertySnapshot(prop: Property): PropertySnapshot {
    const uploadDir = 'uploads/documents/contracts/propertydocuments';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Extract extension from original filename
    const fileExt = prop.documentImage
      ? path.extname(prop.documentImage.filename)
      : '';

    const archivedFilename = `contract_${Date.now()}_prop_doc${fileExt}`;
    const permanentPath = path.join(uploadDir, archivedFilename);

    try {
      if (prop.documentImage?.path) {
        fs.copyFileSync(prop.documentImage.path, permanentPath);
      }
    } catch (error) {
      console.error('Failed to copy property document:', error);
      throw new BadRequestException('Could not archive property ownership document');
    }


    return {
      name: prop.name,
      type: prop.propertyType,
      subType: prop.subType,
      propertyNumber: prop.propertyNumber,
      nationalAddressCode: prop.nationalAddressCode,
      stateName: prop.state?.name || '',
      area: Number(prop.area),
      capacity: prop.capacity,
      isFurnished: prop.isFurnished,
      constructionDate: prop.constructionDate,
      complexName: prop.complexName,
      insurancePolicyNumber: prop.insurancePolicyNumber,
      ownershipType: prop.ownershipType,
      electricityMeter: prop.electricityMeterNumber,
      waterMeter: prop.waterMeterNumber,
      gasMeter: prop.gasMeterNumber,
      features: prop.features || [],
      facilities: prop.facilities || {},
      ownershipDocument: {
        type: prop.documentType,
        number: prop.documentNumber,
        date: prop.documentIssueDate,
        issuedBy: prop.issuedBy,
        ownerIdNumber: prop.ownerIdNumber,
        documentImage: { filename: prop.documentImage?.filename || '', path: permanentPath }
      }
    };
  }

  private generatePaymentSchedule(
    rentType: RentType,
    startDate: Date,
    durationInMonths: number,
    durationInYears: number,
    basePrice: number
  ): PaymentInstallment[] {
    const installments: PaymentInstallment[] = [];

    if (rentType === RentType.MONTHLY) {
      const monthlyAmount = basePrice;

      for (let i = 0; i < Math.ceil(durationInMonths); i++) {
        installments.push({
          dueDate: addDays(startDate, i * this.RENT_MONTH_DAYS),
          amount: monthlyAmount,
          isPaid: false
        });
      }
    }

    if (rentType === RentType.YEARLY) {
      const yearlyAmount = basePrice;

      for (let i = 0; i < Math.ceil(durationInYears); i++) {
        installments.push({
          dueDate: addDays(startDate, i * this.RENT_MONTH_DAYS * 12),
          amount: yearlyAmount,
          isPaid: false
        });
      }
    }

    return installments;
  }

  // ... inside ContractsService

  /**
   * 1. Landlord updates terms and sends back to Tenant
   */
  async landlordUpdateTerms(contractId: string, landlordId: string, newTerms: string) {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: ['tenant', 'landlord']
    });

    if (!contract) throw new NotFoundException('Contract not found or not in review status');

    if (contract.landlordId !== landlordId) {
      throw new UnauthorizedException("Only the assigned landlord can perform this action.");
    }

    if (contract.status !== ContractStatus.PENDING_LANDLORD_ACCEPTANCE) {
      throw new BadRequestException("Contract not in review status")
    }

    contract.currentTerms = newTerms;
    contract.status = ContractStatus.PENDING_TENANT_ACCEPTANCE;
    await this.contractRepo.save(contract);

    // Notify Tenant
    await this.notificationService.createNotification(
      contract.tenantId,
      'TERMS_REVISED',
      'Landlord Revised Terms',
      `The landlord has edited the contract terms for ${contract.propertySnapshot.name}. Please review and accept.`,
      'contract',
      contract.id
    );
  }

  /**
   * 2 & 3. Accept Contract (Used by both Landlord and Tenant)
   */
  async acceptContract(contractId: string, userId: string, dto?: AcceptContractDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const contract = await this.contractRepo.findOne({ where: { id: contractId }, relations: ['tenant', 'landlord'] });
    if (!contract) throw new BadRequestException('Contract cannot be accepted at this stage.');

    if (user.role === UserRole.LANDLORD) {
      if (contract.landlordId !== userId) {
        throw new UnauthorizedException('You are not the authorized landlord for this contract.');
      }
      if (contract.status !== ContractStatus.PENDING_LANDLORD_ACCEPTANCE) {
        throw new BadRequestException('Action denied. This contract is not currently awaiting landlord approval.');
      }

      if (!!dto?.shouldSendRenewalNotify) {
        contract.shouldSendRenewalNotify = true;

        // منطق الخصم والمدة (Validation)
        if (dto?.renewalDiscountAmount ?? 0 > 0) {
          const incentiveMonths = dto.requiredMonthsForIncentive || 0;
          if (incentiveMonths > contract.durationInMonths) {
            throw new BadRequestException(
              `Incentive period (${incentiveMonths}) exceeds contract duration (${contract.durationInMonths}).`
            );
          }
          contract.renewalDiscountAmount = dto.renewalDiscountAmount ?? 0;
          contract.requiredMonthsForIncentive = incentiveMonths;
        }
      }
    }

    else if (user.role === UserRole.TENANT) {
      if (contract.tenantId !== userId) {
        throw new UnauthorizedException('You are not the authorized tenant for this contract.');
      }
      if (contract.status !== ContractStatus.PENDING_TENANT_ACCEPTANCE) {
        throw new BadRequestException('Action denied. This contract is not currently awaiting tenant approval.');
      }
    }

    else {
      throw new ForbiddenException('You do not have the required permissions to accept contracts.');
    }

    contract.status = ContractStatus.PENDING_SIGNATURE;
    await this.contractRepo.save(contract);

    // Notifications
    const admin = await this.userRepo.findOne({ where: { role: UserRole.ADMIN } });

    const notifications = [
      {
        userId: contract.tenantId,
        type: 'CONTRACT_ACCEPTED',
        title: 'Contract Accepted',
        message: 'Terms are agreed! Waiting for Admin to document on Ejar platform.',
        relatedEntityType: 'contract',
        relatedEntityId: contract.id
      },
      {
        userId: contract.landlordId,
        type: 'CONTRACT_ACCEPTED',
        title: 'Contract Accepted',
        message: 'You have accepted the terms. Waiting for Admin to document on Ejar.',
        relatedEntityType: 'contract',
        relatedEntityId: contract.id
      }
    ];

    if (admin) {
      notifications.push({
        userId: admin.id,
        type: 'ADMIN_ACTION_REQUIRED',
        title: 'Contract Ready for Ejar',
        message: `Landlord and Tenant agreed on contract ${contract.id}. Please document on Ejar.`,
        relatedEntityType: 'contract',
        relatedEntityId: contract.id
      });
    }

    await this.notificationService.sendBulkNotificationWithPayload(notifications);
  }

  /**
   * 4. Cancel Contract
   */
  async cancelContract(contractId: string, userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const contract = await this.contractRepo.findOne({ where: { id: contractId }, relations: ['tenant', 'landlord'] });
    if (!contract) throw new NotFoundException('Contract not found');

    if (user.id !== contract.landlordId || user.id !== contract.tenantId) {
      throw new UnauthorizedException('You do not have permission to cancel this contract.');
    }
    // Validation: Only allow cancel if it's currently their turn
    const isLandlordTurn = user.role === UserRole.LANDLORD && contract.status === ContractStatus.PENDING_LANDLORD_ACCEPTANCE;
    const isTenantTurn = user.role === UserRole.TENANT && contract.status === ContractStatus.PENDING_TENANT_ACCEPTANCE;

    if (!isLandlordTurn && !isTenantTurn) {
      throw new BadRequestException('You cannot cancel the contract at this stage.');
    }

    contract.status = ContractStatus.CANCELLED;
    await this.contractRepo.save(contract);

    // Notify the OTHER person
    const recipientId = (user.role === UserRole.LANDLORD) ? contract.tenantId : contract.landlordId;
    await this.notificationService.createNotification(
      recipientId,
      'CONTRACT_CANCELLED',
      'Contract Cancelled',
      `The ${user.role.toLowerCase()} has cancelled the contract request for ${contract.propertySnapshot.name}.`,
      'contract',
      contract.id
    );
  }


  async activateAndUploadPdf(contractId: string, pdfPath: string, contractNumber: string) {
    // 1. جلب العقد والتأكد من حالته
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: ['tenant', 'landlord']
    });

    if (!contract) throw new NotFoundException('Contract not found');

    if (contract.status !== ContractStatus.PENDING_SIGNATURE) {
      throw new BadRequestException('Contract must be in PENDING_SIGNATURE status to be activated.');
    }

    //
    contract.status = ContractStatus.ACTIVE;
    contract.ejarPdfPath = pdfPath;
    contract.contractNumber = contractNumber;
    contract.contractDate = new Date();

    const savedContract = await this.dataSource.transaction(async (transactionalEntityManager) => {

      const updatedContract = await transactionalEntityManager.save(contract);

      await transactionalEntityManager.update(Property, contract.propertyId, {
        isRented: true
      });

      return updatedContract;
    });


    const propertyName = contract.propertySnapshot?.name || 'Property';
    const trimmedName = trimText(propertyName);


    const notifications = [
      {
        userId: contract.tenantId,
        type: 'CONTRACT_ACTIVE',
        title: 'Contract Activated',
        message: `Congratulations! Your contract for "${trimmedName}" has been officially officially documented (No: ${contractNumber}) and is now active. You can download the Ejar PDF.`,
        relatedEntityType: 'contract',
        relatedEntityId: contract.id
      },
      {
        userId: contract.landlordId,
        type: 'CONTRACT_ACTIVE',
        title: 'Contract Activated',
        message: `The contract for "${trimmedName}" has been officially documented (No: ${contractNumber}) and is now active.  You can download the Ejar PDF.`,
        relatedEntityType: 'contract',
        relatedEntityId: contract.id
      }
    ];

    await this.notificationService.sendBulkNotificationWithPayload(notifications);

    return savedContract;
  }

  async terminateContract(contractId: string, userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }


    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: ['tenant', 'landlord']
    });

    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Only active contracts can be terminated.');
    }

    const now = new Date();
    const trimmedName = trimText(contract.propertySnapshot.name);
    contract.terminationInitiatedAt = now;

    // --- CASE 1: TENANT (Immediate) ---
    if (user.role === UserRole.TENANT) {
      if (contract.tenantId !== userId) throw new ForbiddenException('Not your contract');

      contract.status = ContractStatus.TERMINATED;
      contract.terminationEffectiveDate = now;
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.save(contract);

        await transactionalEntityManager.update(Property, contract.propertyId, {
          isRented: false
        });
      });

      // تجهيز قائمة الإشعارات
      const notifications = [
        {
          userId: contract.landlordId,
          type: 'CONTRACT_TERMINATED',
          title: 'Contract Terminated',
          message: `The tenant has terminated the contract No: ${contract.contractNumber} regarding property "${trimmedName}".`,
          relatedEntityType: 'contract',
          relatedEntityId: contract.id
        },
        {
          userId: contract.tenantId,
          type: 'CONTRACT_TERMINATED',
          title: 'Termination Successful',
          message: `You have terminated your contract  No: ${contract.contractNumber} regarding property "${trimmedName}".`,
          relatedEntityType: 'contract',
          relatedEntityId: contract.id
        }
      ];

      // جلب المسؤول (Admin) لإرسال تنبيه له
      const admin = await this.userRepo.findOne({
        where: { role: UserRole.ADMIN },
        select: ['id']
      });

      if (admin) {
        notifications.push({
          userId: admin.id,
          type: 'ADMIN_CONTRACT_TERMINATED',
          title: 'Immediate Contract Termination',
          message: `Tenant "${user.name}" has terminated the contract No: ${contract.contractNumber} regarding property "${trimmedName}".".`,
          relatedEntityType: 'contract',
          relatedEntityId: contract.id
        });
      }
    }

    // --- CASE 2: LANDLORD (60-Day Notice) ---
    else if (user.role === UserRole.LANDLORD) {
      if (contract.landlordId !== userId) throw new ForbiddenException('Not your contract');

      contract.status = ContractStatus.PENDING_TERMINATION;

      // Logic: Add 60 days
      const sixtyDaysLater = new Date();
      sixtyDaysLater.setDate(sixtyDaysLater.getDate() + 60);
      sixtyDaysLater.setHours(0, 0, 0, 0);
      contract.terminationEffectiveDate = sixtyDaysLater;

      await this.contractRepo.save(contract);

      // 1. Get the actor's name (who is doing the termination)
      const tenantName = contract.tenant?.name || 'Tenant';
      const trimmedPropertyName = trimText(contract.propertySnapshot.name);
      const dateString = contract.terminationEffectiveDate.toLocaleDateString('en-GB');

      const notifications: IBulkNotificationPayload[] = [];

      // --- For the Tenant ---
      notifications.push({
        userId: contract.tenantId,
        type: 'TERMINATION_NOTICE',
        title: 'Formal 60-Day Termination Notice',
        message: `The landlord has initiated a contract termination for contract No: ${contract.contractNumber} regarding property "${trimmedPropertyName}". In accordance with your agreement, your official move-out date is set for ${dateString}.`,
        relatedEntityType: 'contract',
        relatedEntityId: contract.id
      });

      // --- For the Landlord ---
      notifications.push({
        userId: contract.landlordId,
        type: 'TERMINATION_NOTICE',
        title: 'Termination Process Started',
        message: `You have successfully sent a termination notice for contract No: ${contract.contractNumber} regarding property  "${trimmedPropertyName}". The contract will end on ${dateString}.`,
        relatedEntityType: 'contract',
        relatedEntityId: contract.id
      });

      // --- For the Admin ---
      const admin = await this.userRepo.findOne({ where: { role: UserRole.ADMIN }, select: ['id'] });
      if (admin) {
        notifications.push({
          userId: admin.id,
          type: 'ADMIN_CONTRACT_TERMINATION_ALERT',
          title: 'Contract Termination Initiated',
          message: `Termination process started for contract No: ${contract.contractNumber} regarding property "${trimmedPropertyName}". Initiated by: Landlord (${user.name}). Tenant: ${tenantName}. Effective Date: ${dateString}.`,
          relatedEntityType: 'contract',
          relatedEntityId: contract.id
        });
      }

      await this.notificationService.sendBulkNotificationWithPayload(notifications);
    }

    return ContractDataMasker.mask(contract, user.role);
  }

  // 
  async findPendingTerminationContracts() {
    return await this.contractRepo.find({
      where: {
        status: ContractStatus.PENDING_TERMINATION,
        terminationEffectiveDate: LessThanOrEqual(new Date())
      },
      relations: ['tenant', 'landlord']
    });
  }

  async autoFinalizeTermination(contractId: string) {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: ['tenant', 'landlord']
    });

    if (!contract) return;

    contract.status = ContractStatus.TERMINATED;
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.save(contract);

      await transactionalEntityManager.update(Property, contract.propertyId, {
        isRented: false
      });
    });

    const trimmedName = trimText(contract.propertySnapshot?.name || 'Property');


    const notifications = [
      {
        userId: contract.tenantId,
        type: 'CONTRACT_TERMINATED',
        title: 'Contract Officially Terminated',
        message: `The 60-day notice for  contract No: ${contract.contractNumber} regarding property "${trimmedName} has ended. The contract is now officially terminated.`,
        relatedEntityType: 'contract', relatedEntityId: contract.id
      },
      {
        userId: contract.landlordId,
        type: 'CONTRACT_TERMINATED',
        title: 'Termination Finalized',
        message: `Termination process  for contract No: ${contract.contractNumber} regarding property "${trimmedName} is complete. The property is now ready for a new tenant.`,
        relatedEntityType: 'contract', relatedEntityId: contract.id
      }
    ];

    // إضافة إشعار المسؤول (Admin)
    const admin = await this.userRepo.findOne({ where: { role: UserRole.ADMIN }, select: ['id'] });
    if (admin) {
      notifications.push({
        userId: admin.id,
        type: 'ADMIN_CONTRACT_TERMINATED',
        title: 'Auto-Termination Complete',
        message: `System has finalized the termination of contract  for contract No: ${contract.contractNumber} regarding property "${trimmedName} after 60-day period.`,
        relatedEntityType: 'contract', relatedEntityId: contract.id
      });
    }

    await this.notificationService.sendBulkNotificationWithPayload(notifications);
  }

  async findExpiredActiveContracts() {
    return await this.contractRepo.find({
      where: {
        status: ContractStatus.ACTIVE, // فقط العقود النشطة
        endDate: LessThanOrEqual(new Date()) // التي انتهى تاريخها
      },
      relations: ['tenant', 'landlord']
    });
  }

  // 2. معالجة الانتهاء وإنشاء طلب التجديد
  async autoExpireAndCreateRenewRequest(contractId: string) {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: ['tenant', 'landlord']
    });

    if (!contract) return;

    contract.status = ContractStatus.TERMINATED;
    contract.terminationInitiatedAt = new Date();
    contract.terminationEffectiveDate = new Date();

    const trimmedName = trimText(contract.propertySnapshot?.name || 'Property');
    const notifications: IBulkNotificationPayload[] = [];

    const incentiveMonths = contract.requiredMonthsForIncentive || 0;
    const totalDaysSpent = differenceInDays(contract.terminationEffectiveDate, contract.startDate);
    const actualMonthsSpent = totalDaysSpent / this.RENT_MONTH_DAYS;


    const isEligibleForRenew =
      contract.shouldSendRenewalNotify &&
      (actualMonthsSpent >= incentiveMonths);



    const savedRenew = await this.dataSource.transaction(async (transactionalEntityManager) => {

      await transactionalEntityManager.save(contract);

      await transactionalEntityManager.update(Property, contract.propertyId, {
        isRented: false
      });

      if (isEligibleForRenew) {
        const existingRenew = await transactionalEntityManager.findOne(RenewRequest, {
          where: { originalContractId: contract.id }
        });

        if (!existingRenew) {
          const renewRequest = transactionalEntityManager.create(RenewRequest, {
            originalContractId: contract.id,
            tenantId: contract.tenantId,
            offeredDiscountAmount: contract.renewalDiscountAmount || 0,
            status: RenewStatus.PENDING
          });
          const savedRenew = await transactionalEntityManager.save(renewRequest);

          // حفظ ID التجديد لاستخدامه في الإشعارات خارج الـ Transaction
          return savedRenew;
        }
      }

    });


    if (isEligibleForRenew) {
      if (savedRenew) {
        // إشعار خاص للمستأجر بالعرض
        notifications.push({
          userId: contract.tenantId,
          type: 'CONTRACT_RENEW_OFFER', // نوع جديد للإشعار
          title: '🎉 Renew Offer Available!',
          message: `Your contract No: ${contract.contractNumber} regarding property "${trimmedName} ended. Renew now & save ${contract.renewalDiscountAmount} SAR!`,
          relatedEntityType: 'renew_request',
          relatedEntityId: savedRenew.id
        });

        // إشعار للمالك بأنه تم إرسال العرض
        notifications.push({
          userId: contract.landlordId,
          type: 'CONTRACT_RENEW_OFFER_SENT',
          title: 'Renew Offer Sent',
          message: `System sent a renewal offer to tenant for contract No: ${contract.contractNumber} regarding property "${trimmedName}.`,
          relatedEntityType: 'contract',
          relatedEntityId: contract.id
        });
      }
    } else {
      // إشعارات الانتهاء العادية (بدون عرض)
      notifications.push({
        userId: contract.tenantId,
        type: 'CONTRACT_EXPIRED',
        title: 'Contract Expired',
        message: `Contract for contract No: ${contract.contractNumber} regarding property "${trimmedName} is now terminated. The system has automatically sent your renewal offer to the tenant.`,
        relatedEntityType: 'contract', relatedEntityId: contract.id
      });
      notifications.push({
        userId: contract.landlordId,
        type: 'CONTRACT_EXPIRED',
        title: 'Contract Expired',
        message: `Contract for contract No: ${contract.contractNumber} regarding property "${trimmedName} has expired naturally.`,
        relatedEntityType: 'contract', relatedEntityId: contract.id
      });
    }

    // إرسال الإشعارات
    await this.notificationService.sendBulkNotificationWithPayload(notifications);
  }

  async getContractById(contractId: string, currentUser: any) {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }


    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isLandlord = contract.landlordId === currentUser.id;
    const isTenant = contract.tenantId === currentUser.id;

    if (!isAdmin && !isLandlord && !isTenant) {
      throw new ForbiddenException('Access denied. You are not a participant in this contract.');
    }


    if (contract.propertySnapshot) {
      contract.propertySnapshot.name = trimText(contract.propertySnapshot.name);
    }
    return ContractDataMasker.mask(contract, currentUser.role);
  }

  async findAll(user: any, query: ContractFilterDto) {

    const filters: Record<string, any> = {};

    if (user.role === UserRole.LANDLORD) {
      filters.landlordId = user.id;
    } else if (user.role === UserRole.TENANT) {
      filters.tenantId = user.id;
    }

    if (query.status && query.status !== 'all') {
      filters.status = query.status;
    }

    const result = await CRUD.findAll<Contract>(
      this.contractRepo,
      'contract',
      query.search,
      query.page,
      query.limit,
      query.sortBy,
      query.sortOrder,
      [],
      [
        'landlordSnapshot.name',
        'propertySnapshot.name',
        'tenantSnapshot.name'
      ],
      filters,
      []
    );
    const records = ContractDataMasker.mask(result.records, user.role);
    return { ...result, records };
  }

  async acceptRenewOffer(renewRequestId: string, tenantId: string) {
    // 1. Fetch the Renew Request with Original Contract
    const renewRequest = await this.renewRepo.findOne({
      where: { id: renewRequestId },
      relations: ['originalContract', 'originalContract.property']
    });

    // 2. Validations
    if (!renewRequest) {
      throw new NotFoundException('Renewal offer not found.');
    }

    if (renewRequest.tenantId !== tenantId) {
      throw new ForbiddenException('You are not authorized to accept this renewal offer.');
    }

    // Check Status (Must be PENDING)
    if (renewRequest.status !== RenewStatus.PENDING) {
      throw new BadRequestException(`Cannot accept offer. Current status is ${renewRequest.status.toLocaleLowerCase()}.`);
    }

    const oldContract = renewRequest.originalContract;
    const property = oldContract.property; // Or fetch fresh property if needed

    // 3. Fetch Fresh Data for Snapshots (Crucial: IDs or details might have changed)
    const tenant = await this.userRepo.findOne({
      where: { id: tenantId },
      relations: ['nationality', 'identityIssueCountry']
    });
    const landlord = await this.userRepo.findOne({
      where: { id: oldContract.landlordId },
      relations: ['nationality', 'identityIssueCountry']
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    if (!landlord || landlord.status !== UserStatus.ACTIVE) {
      throw new NotFoundException('Landlord not found or has been deactivated.');
    }

    // 4. Calculate New Dates
    const oldEndDate = new Date(oldContract.endDate);
    const newStartDate = addDays(oldEndDate, 1);
    newStartDate.setHours(0, 0, 0, 0); // Normalize

    const durationInMonths = oldContract.durationInMonths;
    const durationInYears = durationInMonths / 12;

    // 5. Calculate Financials (Apply Discount)
    const originalTotalPrice = Number(oldContract.totalAmount);
    const discount = Number(renewRequest.offeredDiscountAmount);
    // Ensure total doesn't go below zero
    const newTotalAmount = Math.max(0, originalTotalPrice - discount);
    const newEndDate = addDays(newStartDate, durationInMonths * this.RENT_MONTH_DAYS);

    const rentPerMonth = newTotalAmount / durationInMonths;
    const effectiveMonthsForFee = Math.min(durationInMonths, 12);
    const oneYearRentAmount = rentPerMonth * effectiveMonthsForFee;


    // Recalculate Platform Fee based on new total
    const settings = await this.settingsRepo.findOne({ where: {} });
    const platformFeePercent = settings?.platformPercent ?? 2.5;
    // If contract > 1 year, fee logic might differ, keeping it simple based on total for now:
    const newPlatformFeeAmount = (platformFeePercent ?? 2.5 / 100) * oneYearRentAmount;

    // 6. Create New Contract Entity
    const newContract = this.contractRepo.create({
      tenantId: tenant.id,
      landlordId: landlord.id,
      propertyId: property.id,

      // New Dates
      startDate: newStartDate,
      endDate: newEndDate,
      durationInMonths: durationInMonths,

      // Financials (Discounted)
      totalAmount: newTotalAmount,
      securityDeposit: oldContract.securityDeposit, // Carry over deposit
      rentType: oldContract.rentType,

      // Regenerate Payment Schedule with new dates/amounts
      paymentSchedule: this.generatePaymentSchedule(
        oldContract.rentType,
        newStartDate,
        durationInMonths,
        durationInYears,
        newTotalAmount // Pass the discounted amount here
      ),

      // Fresh Snapshots
      tenantSnapshot: this.mapUserSnapshot(tenant),
      landlordSnapshot: this.mapUserSnapshot(landlord),
      propertySnapshot: this.mapPropertySnapshot(property), // Ensure this method exists or fetch fresh property

      // Terms (Copy original)
      originalTerms: oldContract.originalTerms,
      currentTerms: oldContract.currentTerms,

      platformFeePercentage: platformFeePercent,
      platformFeeAmount: newPlatformFeeAmount,

      // Status: Goes directly to PENDING_SIGNATURE 
      // because Landlord offered it (Already Accepted) and Tenant just Accepted.
      status: ContractStatus.PENDING_SIGNATURE,

      // Reset Renewal flags for the new contract
      shouldSendRenewalNotify: false, // Inherit setting?
      renewalDiscountAmount: 0, // Reset for next cycle
      requiredMonthsForIncentive: 0
    });

    const savedContract = await this.dataSource.transaction(async (transactionalEntityManager) => {
      const contract = await transactionalEntityManager.save(newContract);

      renewRequest.status = RenewStatus.ACCEPTED;
      await transactionalEntityManager.save(renewRequest);

      await transactionalEntityManager.update(Property, oldContract.propertyId, {
        isRented: true
      });

      return ContractDataMasker.mask(contract, tenant.role);
    });
    // 9. Notifications
    const trimmedName = trimText(property.name || 'Property');

    await this.notificationService.sendBulkNotificationWithPayload([
      {
        userId: landlord.id,
        type: 'CONTRACT_ACCEPTED', // Or specific type RENEWAL_ACCEPTED
        title: 'Renewal Accepted!',
        message: `Tenant accepted the renewal offer for "${trimmedName}". Contract #${savedContract.contractNumber} is created and awaits signature.`,
        relatedEntityType: 'contract',
        relatedEntityId: savedContract.id
      },
      {
        userId: tenant.id,
        type: 'CONTRACT_CREATED',
        title: 'Renewal Contract Created',
        message: `You successfully renewed "${trimmedName}". Please sign the new contract to finalize.`,
        relatedEntityType: 'contract',
        relatedEntityId: savedContract.id
      }
    ]);

    // Admin Notification
    const admin = await this.userRepo.findOne({ where: { role: UserRole.ADMIN } });
    if (admin) {
      await this.notificationService.sendBulkNotificationWithPayload([{
        userId: admin.id,
        type: 'ADMIN_CONTRACT_ALERT',
        title: 'Contract Renewed',
        message: `Renewal successful for "${trimmedName}". New Contract #${savedContract.id} created via auto-offer.`,
        relatedEntityType: 'contract',
        relatedEntityId: savedContract.id
      }]);
    }

    return savedContract;
  }



  async rejectRenewOffer(renewRequestId: string, tenantId: string) {
    // 1. البحث عن طلب التجديد مع العقد الأصلي
    const renewRequest = await this.renewRepo.findOne({
      where: { id: renewRequestId },
      relations: ['originalContract']
    });

    // 2. التحقق من الوجود والملكية
    if (!renewRequest) {
      throw new NotFoundException('Renewal offer not found.');
    }

    if (renewRequest.tenantId !== tenantId) {
      throw new ForbiddenException('You are not authorized to reject this offer.');
    }

    // التحقق من أن الحالة الحالية تسمح بالرفض (يجب أن يكون معلقاً)
    if (renewRequest.status !== RenewStatus.PENDING) {
      throw new BadRequestException(`Cannot reject offer. Current status is ${renewRequest.status.toLocaleLowerCase()}.`);
    }

    // 3. تحديث الحالة إلى مرفوض
    renewRequest.status = RenewStatus.REJECTED;
    await this.renewRepo.save(renewRequest);

    // 4. إعداد الإشعارات
    const contract = renewRequest.originalContract;
    const trimmedName = trimText(contract.propertySnapshot?.name || 'Property');


    const notifications: IBulkNotificationPayload[] = [
      {
        userId: contract.landlordId,
        type: 'CONTRACT_RENEWAL_REJECTED',
        title: 'Renewal Offer Rejected',
        message: `The tenant has declined the renewal offer for property "${trimmedName}" (Contract ${contract.contractNumber}). The property will remain terminated.`,
        relatedEntityType: 'contract',
        relatedEntityId: contract.id
      },
      {
        userId: tenantId,
        type: 'CONTRACT_RENEWAL_REJECTED',
        title: 'Offer Declined',
        message: `You have successfully declined the renewal offer for "${trimmedName}".`,
        relatedEntityType: 'contract',
        relatedEntityId: contract.id
      }
    ];

    await this.notificationService.sendBulkNotificationWithPayload(notifications);

    return { message: 'Renewal offer has been rejected successfully.' };
  }

  async processExpiredRenewRequests() {
    // حساب تاريخ ما قبل 60 يوماً من الآن
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const expiredRequests = await this.renewRepo.find({
      where: {
        status: RenewStatus.PENDING,
        created_at: LessThanOrEqual(sixtyDaysAgo)
      },
      relations: ['originalContract']
    });

    if (expiredRequests.length === 0) return;

    for (const request of expiredRequests) {
      request.status = RenewStatus.EXPIRED;
      await this.renewRepo.save(request);

      // إشعار المالك والمستأجر بانتهاء صلاحية العرض
      const trimmedName = trimText(request.originalContract?.propertySnapshot?.name || 'Property');

      await this.notificationService.sendBulkNotificationWithPayload([
        {
          userId: request.tenantId,
          type: 'RENEW_OFFER_EXPIRED',
          title: 'Renewal Offer Expired',
          message: `The renewal offer for "${trimmedName}" has expired because 60 days have passed.`,
          relatedEntityType: 'contract',
          relatedEntityId: request.originalContractId
        },
        {
          userId: request.originalContract.landlordId,
          type: 'RENEW_OFFER_EXPIRED',
          title: 'Renewal Offer Expired',
          message: `The renewal offer sent to the tenant for "${trimmedName}" has expired.`,
          relatedEntityType: 'contract',
          relatedEntityId: request.originalContractId
        }
      ]);
    }

    return expiredRequests.length;
  }

  async findAllRenewRequests(user: any, query: RenewFilterDto) {
    const filters: Record<string, any> = {};

    filters.tenantId = user.id;

    if (query.status && query.status !== 'all') {
      filters.status = query.status;
    }

    const result = await CRUD.findAll<RenewRequest>(
      this.renewRepo,
      'renew_request',
      '',
      query.page,
      query.limit,
      query.sortBy || 'created_at',
      query.sortOrder || 'DESC',
      ['originalContract'],
      [],
      filters,
      []
    );


    const records = ContractDataMasker.maskRenew(result.records, user.role);
    return { ...result, records };
  }
}