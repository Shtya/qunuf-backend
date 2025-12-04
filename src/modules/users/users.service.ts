import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
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

  async validateUser(email: string, password: string): Promise<User> {
    // 1. Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'status', 'role'], // explicitly include passwordHash
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

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create a new User entity instance
    const user = this.userRepository.create({
      email: createUserDto.email,
      name: createUserDto.name,
      passwordHash: hashedPassword,
      status: UserStatus.PENDING_VERIFICATION, // set default status
      role: createUserDto.role
    });

    // Save it to the database
    return await this.userRepository.save(user);
  }

  async findAll() {
    return this.userRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

}
