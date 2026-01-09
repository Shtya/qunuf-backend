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


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Country)
    private countryRepository: Repository<Country>,

    @InjectRepository(State)
    private stateRepository: Repository<State>,
  ) { }


  public maskSensitiveUserInfo(user: Partial<User>) {
    // if (user.identityNumber) {
    //     user.identityNumber = user.identityNumber.replace(/^(.{2}).*(.{2})$/, '$1******$2');
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

  async findAll() {
    const users = await this.userRepository.find();
    return users;
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['address', 'nationality', 'identityIssueCountry']
    });

    if (!user) throw new NotFoundException('User not found');

    const [nationality, stateExists, identityCountry, saudiArabia] = await Promise.all([
      updateUserDto.nationalityId
        ? this.countryRepository.findOneBy({ id: updateUserDto.nationalityId })
        : null,
      updateUserDto.address?.stateId
        ? this.stateRepository.findOneBy({ id: updateUserDto.address.stateId })
        : null,
      updateUserDto.identityIssueCountryId
        ? this.countryRepository.findOneBy({ id: updateUserDto.identityIssueCountryId })
        : null,
      this.countryRepository.findOneBy({ iso2: 'SA' })
    ]);

    if (updateUserDto.nationalityId && !nationality)
      throw new NotFoundException('Nationality country not found');
    if (updateUserDto.address?.stateId && !stateExists)
      throw new NotFoundException('Selected state not found');
    if (updateUserDto.identityIssueCountryId && !identityCountry)
      throw new NotFoundException('Identity issue country not found');

    if (nationality) user.nationality = nationality;

    if (updateUserDto.address) {
      user.address = user.address || ({} as Address); // tell TS it's Address type
      user.address.userId = user.id;

      const addr = updateUserDto.address;
      if (addr.city !== undefined) user.address.city = addr.city.trim();
      if (addr.stateId !== undefined) user.address.stateId = addr.stateId.trim();
      if (addr.streetName !== undefined) user.address.streetName = addr.streetName.trim();
      if (addr.buildingNumber !== undefined) user.address.buildingNumber = addr.buildingNumber.trim();
      if (addr.postalCode !== undefined) user.address.postalCode = addr.postalCode?.trim();
      if (addr.additionalNumber !== undefined) user.address.additionalNumber = addr.additionalNumber?.trim();
    }


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

    await this.userRepository.delete(id);
    return null;
  }

  // Get current user by ID
  async getUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'address',
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
        passwordHash: true,
        phoneNumber: true,
        birthDate: true,
        identityType: true,
        identityOtherType: true,
        identityNumber: true,
        notificationsEnabled: true,
        created_at: true,
        updated_at: true,
        deleted_at: true
      }
    });

    if (!user) throw new NotFoundException('User not found');

    return this.maskSensitiveUserInfo(user);
  }
}
