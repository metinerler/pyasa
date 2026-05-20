import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { username } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.usersRepo.update(id, dto);
    return this.findById(id);
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<User> {
    await this.usersRepo.update(id, { avatarUrl });
    return this.findById(id);
  }

  async search(query: string): Promise<User[]> {
    return this.usersRepo
      .createQueryBuilder('user')
      .where('user.username ILIKE :q OR user.name ILIKE :q', { q: `%${query}%` })
      .limit(20)
      .getMany();
  }
}
