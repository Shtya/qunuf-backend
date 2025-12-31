import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserStatus } from '../../common/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async validateUser(email: string, password: string) {
    // 1. Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'status', 'role'], // include passwordHash
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Compare provided password with stored hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Return user if valid
    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
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

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const merged = this.userRepository.merge(user, updateUserDto);
    const updated = await this.userRepository.save(merged);
    return updated;
  }

  async remove(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.userRepository.delete(id);
    return null;
  }
}
