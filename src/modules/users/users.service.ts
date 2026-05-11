import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateUserProfileDto } from './dto/update-user.dto';
import { IdentityType, User, UserRole, UserStatus } from '../../common/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Country } from 'src/common/entities/country.entity';
import { State } from 'src/common/entities/state.entity';
import { Address } from 'src/common/entities/address.entity';
import { deleteFile } from 'src/common/utils/file.util';
import { UserFilterDto } from './dto/user-filter.dto';
import { CRUD, CustomPaginatedResponse } from 'src/common/services/crud.service';
import { ExportService } from 'src/common/services/exportService';
import { UserDataMasker } from 'src/common/utils/UserDataMasker';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Country)
    private countryRepository: Repository<Country>,

    @InjectRepository(State)
    private stateRepository: Repository<State>,

    private readonly exportService: ExportService,
  ) { }


  public maskSensitiveUserInfo(user: Partial<User>) {
    // if (user.identityNumber) {
    //   user.identityNumber = user.identityNumber.replace(/^(.{2}).*(.{2})$/, '$1******$2');
    // }
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async validateUser(email: string, password: string) {
    // 1. Find user by email
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.passwordHash') // This "adds" the hidden field to the normal selection
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Compare provided password with stored hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Return user if valid
    const { passwordHash, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const allowedRoles = [UserRole.TENANT, UserRole.LANDLORD];
    if (!allowedRoles.includes(createUserDto.role)) {
      throw new BadRequestException('Invalid role. Registration only allowed for Tenants and Landlords.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      email: createUserDto.email,
      name: createUserDto.name,
      passwordHash: hashedPassword,
      status: UserStatus.PENDING_VERIFICATION, // default status
      role: createUserDto.role,
    });

    const saved = await this.userRepository.save(user);
    return saved;
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['nationality', 'identityIssueCountry']
      //'address', 
    });

    if (!user) throw new NotFoundException('User not found');

    const [nationality, identityCountry, saudiArabia] = await Promise.all([
      updateUserDto.nationalityId
        ? this.countryRepository.findOneBy({ id: updateUserDto.nationalityId })
        : null,
      // updateUserDto.address?.stateId
      //   ? this.stateRepository.findOneBy({ id: updateUserDto.address.stateId })
      //   : null,
      updateUserDto.identityIssueCountryId
        ? this.countryRepository.findOneBy({ id: updateUserDto.identityIssueCountryId })
        : null,
      this.countryRepository.findOneBy({ iso2: 'SA' })
    ]);

    if (updateUserDto.nationalityId && !nationality)
      throw new NotFoundException('Nationality country not found');
    // if (updateUserDto.address?.stateId && !stateExists)
    //   throw new NotFoundException('Selected state not found');
    if (updateUserDto.identityIssueCountryId && !identityCountry)
      throw new NotFoundException('Identity issue country not found');

    if (nationality) user.nationality = nationality;

    // if (updateUserDto.address) {
    //   user.address = user.address || ({} as Address); // tell TS it's Address type
    //   user.address.userId = user.id;

    //   const addr = updateUserDto.address;
    //   if (addr.city !== undefined) user.address.city = addr.city.trim();
    //   if (addr.stateId !== undefined) user.address.stateId = addr.stateId.trim();
    //   if (addr.streetName !== undefined) user.address.streetName = addr.streetName.trim();
    //   if (addr.buildingNumber !== undefined) user.address.buildingNumber = addr.buildingNumber.trim();
    //   if (addr.postalCode !== undefined) user.address.postalCode = addr.postalCode?.trim();
    //   if (addr.additionalNumber !== undefined) user.address.additionalNumber = addr.additionalNumber?.trim();
    // }


    const saudiIdentityTypes = [
      IdentityType.NATIONAL_ID,
      IdentityType.RESIDENCY,
      IdentityType.PREMIUM_RESIDENCY
    ];

    if (updateUserDto.identityType) {
      user.identityType = updateUserDto.identityType;

      if (saudiIdentityTypes.includes(updateUserDto.identityType)) {
        if (saudiArabia) user.identityIssueCountry = saudiArabia;
      } else if (identityCountry) {
        user.identityIssueCountry = identityCountry;
      }

      user.identityOtherType = updateUserDto.identityType === IdentityType.OTHER
        ? updateUserDto.identityOtherType?.trim() ?? null
        : null;
    }

    if (updateUserDto.name !== undefined) user.name = updateUserDto.name.trim();
    if (updateUserDto.phoneNumber !== undefined) user.phoneNumber = updateUserDto.phoneNumber.trim();
    if (updateUserDto.birthDate !== undefined) user.birthDate = updateUserDto.birthDate;
    if (updateUserDto.identityNumber !== undefined) user.identityNumber = updateUserDto.identityNumber.trim();
    if (updateUserDto.shortAddress !== undefined) user.shortAddress = updateUserDto.shortAddress.trim();

    await this.userRepository.save(user);
    return await this.getUser(user.id);
  }

  async updateImage(id: string, imagePath?: string) {
    const existing = await this.userRepository.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Team member not found');


    if (imagePath) {
      await deleteFile(existing.imagePath);
      existing.imagePath = imagePath;
    }

    return await this.userRepository.save(existing);
  }

  async remove(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Action denied: Administrative accounts cannot be deleted.');
    }

    await this.userRepository.delete(id);
    return null;
  }

  // Get current user by ID
  async getUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        //'address', 
        'nationality',
        'identityIssueCountry'
      ],
      select: {
        // Include general info (default true)
        id: true,
        email: true,
        pendingEmail: true,
        name: true,
        role: true,
        status: true,
        imagePath: true,
        lastLogin: true,

        // Explicitly select "select: false" fields
        nationalityId: true,
        phoneNumber: true,
        birthDate: true,
        identityType: true,
        identityOtherType: true,
        identityNumber: true,
        identityIssueCountryId: true,
        notificationsEnabled: true,
        shortAddress: true,
        created_at: true,
        updated_at: true,
        deleted_at: true
      }
    });

    if (!user) throw new NotFoundException('User not found');

    return this.maskSensitiveUserInfo(user);
  }

  // Admin: Get all users with pagination and filters
  async findAll(user: any, query: UserFilterDto): Promise<CustomPaginatedResponse<User>> {
    const filters: Record<string, any> = {};

    // Apply Status Filter
    if (query.status && query.status !== 'all') {
      filters.status = query.status;
    }

    // Apply Role Filter
    if (query.role && query.role !== 'all') {
      filters.role = query.role;
    }

    // Call CRUD utility
    return CRUD.findAll<User>(
      this.userRepository,
      'user',
      query.search,
      query.page,
      query.limit,
      query.sortBy,
      query.sortOrder,
      ['nationality', 'identityIssueCountry'], // relations
      ['name', 'email'], // search fields
      filters,
      ['identityType', 'notificationsEnabled', 'identityNumber', 'identityOtherType', 'birthDate', 'phoneNumber'] // extra selects
    );
  }

  // Admin: Get full user details
  async findOneFull(id: string) {
    const queryBuilder = this.userRepository.createQueryBuilder('user')

      .addSelect([
        'user.id',
        'user.identityType',
        'user.notificationsEnabled',
        'user.identityNumber',
        'user.identityOtherType',
        'user.birthDate',
        'user.phoneNumber'
      ])

      .leftJoinAndSelect('user.nationality', 'nationality')

      .leftJoinAndSelect('user.identityIssueCountry', 'identityCountry')
      .where('user.id = :id', { id })
      .andWhere('user.deleted_at IS NULL');

    const user = await queryBuilder.getOne();

    if (!user) throw new NotFoundException('User not found');

    return UserDataMasker.mask(user, UserRole.ADMIN);
  }

  // Admin: Update user status
  async updateStatus(id: string, status: UserStatus) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Action denied: Administrative accounts cannot be deactivated or have their status modified.');
    }

    user.status = status;
    return await this.userRepository.save(user);
  }

  // Admin: Export users to Excel
  async exportUsers(user: any, query: UserFilterDto) {
    const filters: Record<string, any> = {};

    // Apply Status Filter
    if (query.status && query.status !== 'all') {
      filters.status = query.status;
    }

    // Apply Role Filter
    if (query.role && query.role !== 'all') {
      filters.role = query.role;
    }

    // Get users with limit
    const { records: users } = await CRUD.findAllLimited<User>(
      this.userRepository,
      'user',
      query.limit,
      query.search,
      query.sortBy,
      query.sortOrder,
      ['nationality', 'identityIssueCountry'], // relations
      ['name', 'email'], // search fields
      filters,
      ['identityType', 'notificationsEnabled', 'identityNumber', 'identityOtherType', 'birthDate', 'phoneNumber'] // extra selects
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const exportData = users.map(u => {
      const userLink = `${frontendUrl}/dashboard/users?view=${u.id}`;

      return {
        name: {
          formula: `HYPERLINK("${userLink}", "${u.name}")`,
          result: u.name // Fallback text
        },
        email: u.email,
        role: u.role?.toUpperCase(),
        status: u.status?.toUpperCase(),
        phoneNumber: u.phoneNumber || 'N/A',
        birthDate: u.birthDate ? new Date(u.birthDate).toLocaleDateString() : 'N/A',
        nationality: u.nationality ? (u.nationality.name || u.nationality.name_ar) : 'N/A',
        identityType: u.identityType || 'N/A',
        identityNumber: u.identityNumber || 'N/A',
        identityOtherType: (u.identityType === 'other' && u.identityOtherType) ? u.identityOtherType : 'N/A',
        identityIssueCountry: u.identityIssueCountry ? (u.identityIssueCountry.name || u.identityIssueCountry.name_ar) : 'N/A',
        shortAddress: u.shortAddress || 'N/A',
        notificationsEnabled: u.notificationsEnabled ? 'Yes' : 'No',
        lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never',
        createdAt: new Date(u.created_at).toLocaleDateString(),
        updatedAt: u.updated_at ? new Date(u.updated_at).toLocaleDateString() : 'N/A',
      };
    });

    // Define columns
    const columns = [
      {
        header: 'Name', key: 'name', width: 25, style: {
          font: {
            color: { argb: 'FF0000FF' }, // Classic link blue
            underline: true
          }
        }
      },
      { header: 'Email', key: 'email', width: 35 },
      { header: 'Role', key: 'role', width: 12 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Phone Number', key: 'phoneNumber', width: 18 },
      { header: 'Birth Date', key: 'birthDate', width: 15 },
      { header: 'Nationality', key: 'nationality', width: 20 },
      { header: 'Identity Type', key: 'identityType', width: 18 },
      { header: 'Identity Number', key: 'identityNumber', width: 20 },
      { header: 'Identity Other Type', key: 'identityOtherType', width: 20 },
      { header: 'Identity Issue Country', key: 'identityIssueCountry', width: 25 },
      { header: 'Short Address', key: 'shortAddress', width: 15 },
      { header: 'Notifications Enabled', key: 'notificationsEnabled', width: 20 },
      { header: 'Last Login', key: 'lastLogin', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 15 },
    ];

    return this.exportService.generateExcel('Users', exportData, columns);
  }
}
