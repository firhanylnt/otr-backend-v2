import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { ListeningHistory } from '../../entities/listening-history.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CreatorsService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ListeningHistory)
    private historyRepository: Repository<ListeningHistory>,
  ) {}

  /**
   * Calculate total plays for a creator's songs excluding admin listeners
   */
  private async getTotalPlaysForCreator(creatorId: string): Promise<number> {
    const result = await this.historyRepository
      .createQueryBuilder('h')
      .innerJoin('songs', 's', 's.id = h.songId')
      .innerJoin('users', 'u', 'u.id = h.userId')
      .select('COALESCE(SUM(h.playCount), 0)', 'totalPlays')
      .where('s.creatorId = :creatorId', { creatorId })
      .andWhere('u.role != :adminRole', { adminRole: UserRole.ADMIN })
      .getRawOne();
    return parseInt(result?.totalPlays) || 0;
  }

  async findAll(options?: { status?: string; search?: string; page?: number; limit?: number }) {
    const { status, search, page = 1, limit = 20 } = options || {};
    const query = this.usersRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.CREATOR })
      .leftJoinAndSelect('user.songs', 'song')
      .leftJoinAndSelect('user.albums', 'album');

    if (status && status !== 'all') {
      query.andWhere('user.status = :status', { status });
    }

    if (search && search !== 'undefined' && search.trim() !== '') {
      query.andWhere(
        '(user.username ILIKE :search OR user.displayName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await query.getCount();
    const creators = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getMany();

    // Calculate totalPlays for each creator (excluding admin listeners)
    const formattedCreators = await Promise.all(
      creators.map(async (creator) => {
        const totalPlays = await this.getTotalPlaysForCreator(creator.id);
        return this.formatCreator(creator, totalPlays);
      }),
    );

    return {
      data: formattedCreators,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const creator = await this.usersRepository.findOne({
      where: { id, role: UserRole.CREATOR },
      relations: ['songs', 'albums', 'playlists'],
    });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }
    const totalPlays = await this.getTotalPlaysForCreator(creator.id);
    return this.formatCreator(creator, totalPlays);
  }

  async updateStatus(id: string, status: UserStatus) {
    const creator = await this.usersRepository.findOne({
      where: { id, role: UserRole.CREATOR },
      relations: ['songs', 'albums'],
    });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }
    creator.status = status;
    await this.usersRepository.save(creator);
    const totalPlays = await this.getTotalPlaysForCreator(creator.id);
    return this.formatCreator(creator, totalPlays);
  }

  async upgradeToResident(id: string) {
    const creator = await this.usersRepository.findOne({
      where: { id, role: UserRole.CREATOR },
      relations: ['songs', 'albums'],
    });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }
    creator.role = UserRole.RESIDENT;
    await this.usersRepository.save(creator);
    const totalPlays = await this.getTotalPlaysForCreator(creator.id);
    return this.formatCreator(creator, totalPlays);
  }

  async create(createCreatorDto: any) {
    // Check if email already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createCreatorDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Check if username already exists
    const existingUsername = await this.usersRepository.findOne({
      where: { username: createCreatorDto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(createCreatorDto.password || 'creator123', 10);

    const creator = this.usersRepository.create({
      email: createCreatorDto.email,
      username: createCreatorDto.username,
      password: hashedPassword,
      displayName: createCreatorDto.displayName || createCreatorDto.name || createCreatorDto.username,
      bio: createCreatorDto.bio,
      avatarUrl: createCreatorDto.avatar || createCreatorDto.avatarUrl,
      genres: createCreatorDto.genres,
      role: UserRole.CREATOR,
      status: UserStatus.ACTIVE,
    });

    await this.usersRepository.save(creator);
    return this.formatCreator(creator, 0); // New creator has 0 plays
  }

  async update(id: string, updateCreatorDto: any) {
    const creator = await this.usersRepository.findOne({
      where: { id, role: UserRole.CREATOR },
      relations: ['songs', 'albums'],
    });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    if (updateCreatorDto.displayName) creator.displayName = updateCreatorDto.displayName;
    if (updateCreatorDto.username) creator.username = updateCreatorDto.username;
    if (updateCreatorDto.email) creator.email = updateCreatorDto.email;
    if (updateCreatorDto.bio) creator.bio = updateCreatorDto.bio;
    if (updateCreatorDto.avatar || updateCreatorDto.avatarUrl) {
      creator.avatarUrl = updateCreatorDto.avatar || updateCreatorDto.avatarUrl;
    }
    if (updateCreatorDto.banner || updateCreatorDto.bannerUrl) {
      creator.bannerUrl = updateCreatorDto.banner || updateCreatorDto.bannerUrl;
    }
    if (updateCreatorDto.genres) creator.genres = updateCreatorDto.genres;
    if (updateCreatorDto.status) creator.status = updateCreatorDto.status;

    await this.usersRepository.save(creator);
    const totalPlays = await this.getTotalPlaysForCreator(creator.id);
    return this.formatCreator(creator, totalPlays);
  }

  async remove(id: string) {
    const creator = await this.usersRepository.findOne({
      where: { id, role: UserRole.CREATOR },
    });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }
    await this.usersRepository.remove(creator);
    return { success: true, message: 'Creator deleted successfully' };
  }

  async getStats() {
    const total = await this.usersRepository.count({
      where: { role: UserRole.CREATOR },
    });

    const active = await this.usersRepository.count({
      where: { role: UserRole.CREATOR, status: UserStatus.ACTIVE },
    });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.createdAt > :date', { date: thisMonth })
      .andWhere('user.role = :role', { role: UserRole.CREATOR })
      .getCount();

    const suspended = await this.usersRepository.count({
      where: { status: UserStatus.SUSPENDED, role: UserRole.CREATOR },
    });

    return {
      total,
      active,
      newThisMonth,
      suspended,
    };
  }

  private formatCreator(user: User, totalPlays: number = 0) {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatarUrl,
      banner: user.bannerUrl,
      bio: user.bio,
      genres: user.genres,
      status: user.status,
      role: user.role,
      songsCount: user.songs?.length || 0,
      albumsCount: user.albums?.length || 0,
      totalPlays,
      joinedAt: user.createdAt,
      lastActive: user.lastActiveAt,
    };
  }
}

