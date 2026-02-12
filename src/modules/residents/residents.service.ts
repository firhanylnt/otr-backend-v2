import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { ListeningHistory } from '../../entities/listening-history.entity';

@Injectable()
export class ResidentsService {
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
      .where('user.role = :role', { role: UserRole.RESIDENT })
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
    const residents = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getMany();

    // Calculate totalPlays for each resident (excluding admin listeners)
    const formattedResidents = await Promise.all(
      residents.map(async (resident) => {
        const totalPlays = await this.getTotalPlaysForCreator(resident.id);
        return this.formatResident(resident, totalPlays);
      }),
    );

    return {
      data: formattedResidents,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const resident = await this.usersRepository.findOne({
      where: { id, role: UserRole.RESIDENT },
      relations: ['songs', 'albums', 'playlists'],
    });
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }
    const totalPlays = await this.getTotalPlaysForCreator(resident.id);
    return this.formatResident(resident, totalPlays);
  }

  async addResidents(creatorIds: string[]) {
    const creators = await this.usersRepository.findBy({
      id: In(creatorIds),
      role: UserRole.CREATOR,
    });
    
    for (const creator of creators) {
      creator.role = UserRole.RESIDENT;
    }
    
    await this.usersRepository.save(creators);
    return { success: true, upgraded: creators.length };
  }

  async updateStatus(id: string, status: UserStatus) {
    const resident = await this.usersRepository.findOne({
      where: { id, role: UserRole.RESIDENT },
      relations: ['songs', 'albums'],
    });
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }
    resident.status = status;
    await this.usersRepository.save(resident);
    const totalPlays = await this.getTotalPlaysForCreator(resident.id);
    return this.formatResident(resident, totalPlays);
  }

  async removeResident(id: string) {
    const resident = await this.usersRepository.findOne({
      where: { id, role: UserRole.RESIDENT },
    });
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }
    resident.role = UserRole.CREATOR;
    await this.usersRepository.save(resident);
    return { success: true };
  }

  async update(id: string, updateResidentDto: any) {
    const resident = await this.usersRepository.findOne({
      where: { id, role: UserRole.RESIDENT },
      relations: ['songs', 'albums'],
    });
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    if (updateResidentDto.displayName) resident.displayName = updateResidentDto.displayName;
    if (updateResidentDto.username) resident.username = updateResidentDto.username;
    if (updateResidentDto.email) resident.email = updateResidentDto.email;
    if (updateResidentDto.bio) resident.bio = updateResidentDto.bio;
    if (updateResidentDto.avatar || updateResidentDto.avatarUrl) {
      resident.avatarUrl = updateResidentDto.avatar || updateResidentDto.avatarUrl;
    }
    if (updateResidentDto.banner || updateResidentDto.bannerUrl) {
      resident.bannerUrl = updateResidentDto.banner || updateResidentDto.bannerUrl;
    }
    if (updateResidentDto.genres) resident.genres = updateResidentDto.genres;
    if (updateResidentDto.nextShow) resident.nextShow = updateResidentDto.nextShow;
    if (updateResidentDto.status) resident.status = updateResidentDto.status;

    await this.usersRepository.save(resident);
    const totalPlays = await this.getTotalPlaysForCreator(resident.id);
    return this.formatResident(resident, totalPlays);
  }

  async getStats() {
    const total = await this.usersRepository.count({
      where: { role: UserRole.RESIDENT },
    });

    const active = await this.usersRepository.count({
      where: { role: UserRole.RESIDENT, status: UserStatus.ACTIVE },
    });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.createdAt > :date', { date: thisMonth })
      .andWhere('user.role = :role', { role: UserRole.RESIDENT })
      .getCount();

    const suspended = await this.usersRepository.count({
      where: { status: UserStatus.SUSPENDED, role: UserRole.RESIDENT },
    });

    return {
      total,
      active,
      newThisMonth,
      suspended,
    };
  }

  private formatResident(user: User, totalPlays: number = 0) {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatarUrl,
      banner: user.bannerUrl,
      bio: user.bio,
      genres: user.genres,
      nextShow: user.nextShow,
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

