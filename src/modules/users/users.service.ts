import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User, UserStatus, UserRole } from '../../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(options?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    role?: string;
  }) {
    const { status, search, page = 1, limit = 20, role } = options || {};

    const query = this.usersRepository.createQueryBuilder('user');

    // Filter by role if provided, otherwise exclude admins
    if (role && role !== 'undefined' && role !== 'all') {
      query.where('user.role = :role', { role });
    } else {
      query.where('user.role != :adminRole', { adminRole: UserRole.ADMIN });
    }

    if (status && status !== 'undefined' && status !== 'all') {
      query.andWhere('user.status = :status', { status });
    }

    if (search && search !== 'undefined' && search.trim() !== '') {
      query.andWhere(
        '(user.username ILIKE :search OR user.email ILIKE :search OR user.displayName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await query.getCount();
    const users = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getMany();

    return {
      data: users.map(this.sanitizeUser),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['songs', 'albums', 'playlists'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async create(createUserDto: CreateUserDto) {
    // Check if email already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Check if username already exists
    const existingUsername = await this.usersRepository.findOne({
      where: { username: createUserDto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password || 'admin123', 10);

    const user = this.usersRepository.create({
      email: createUserDto.email,
      username: createUserDto.username,
      password: hashedPassword,
      displayName: createUserDto.displayName || createUserDto.name || createUserDto.username,
      bio: createUserDto.bio,
      avatarUrl: createUserDto.avatar || createUserDto.avatarUrl,
      genres: createUserDto.genres,
      role: createUserDto.role || UserRole.USER,
      status: createUserDto.status || UserStatus.ACTIVE,
    });

    await this.usersRepository.save(user);
    return this.sanitizeUser(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update fields
    if (updateUserDto.displayName) user.displayName = updateUserDto.displayName;
    if (updateUserDto.username) user.username = updateUserDto.username;
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.bio) user.bio = updateUserDto.bio;
    if (updateUserDto.avatar || updateUserDto.avatarUrl) {
      user.avatarUrl = (updateUserDto.avatar || updateUserDto.avatarUrl)!;
    }
    if (updateUserDto.genres) user.genres = updateUserDto.genres;
    if (updateUserDto.role) user.role = updateUserDto.role;
    if (updateUserDto.status) user.status = updateUserDto.status;

    await this.usersRepository.save(user);
    return this.sanitizeUser(user);
  }

  async updateStatus(id: string, status: UserStatus) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.status = status;
    await this.usersRepository.save(user);
    return this.sanitizeUser(user);
  }

  async remove(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepository.remove(user);
    return { success: true, message: 'User deleted successfully' };
  }

  async getStats() {
    const total = await this.usersRepository.count({
      where: { role: UserRole.USER },
    });
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const active = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.lastActiveAt > :date', { date: thirtyDaysAgo })
      .andWhere('user.role = :role', { role: UserRole.USER })
      .getCount();

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.createdAt > :date', { date: thisMonth })
      .andWhere('user.role = :role', { role: UserRole.USER })
      .getCount();

    const suspended = await this.usersRepository.count({
      where: { status: UserStatus.SUSPENDED, role: UserRole.USER },
    });

    return {
      total,
      active,
      newThisMonth,
      suspended,
    };
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return {
      id: result.id,
      email: result.email,
      username: result.username,
      displayName: result.displayName,
      avatar: result.avatarUrl,
      bio: result.bio,
      role: result.role,
      status: result.status,
      genres: result.genres,
      joinedAt: result.createdAt,
      lastActive: result.lastActiveAt,
      libraryCount: (result.songs?.length || 0) + (result.albums?.length || 0),
      // Derived from role
      isCreator: result.role === UserRole.CREATOR || result.role === UserRole.RESIDENT || result.role === UserRole.ADMIN,
      isAdmin: result.role === UserRole.ADMIN,
      isResident: result.role === UserRole.RESIDENT,
    };
  }
}

