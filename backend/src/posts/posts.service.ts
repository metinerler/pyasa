import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private readonly postsRepo: Repository<Post>,
  ) {}

  async create(authorId: string, dto: CreatePostDto, imageUrl?: string): Promise<Post> {
    const post = this.postsRepo.create({ ...dto, authorId, imageUrl });
    return this.postsRepo.save(post);
  }

  async findAll(page = 1, limit = 20): Promise<Post[]> {
    return this.postsRepo.find({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findNearby(lat: number, lon: number, radiusKm: number, page = 1, limit = 20): Promise<Post[]> {
    const radiusDeg = radiusKm / 111;
    return this.postsRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where(
        `post.latitude IS NOT NULL AND post.longitude IS NOT NULL
         AND ABS(post.latitude - :lat) < :r
         AND ABS(post.longitude - :lon) < :r`,
        { lat, lon, r: radiusDeg },
      )
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
  }

  async findById(id: string): Promise<Post> {
    const post = await this.postsRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post bulunamadı.');
    return post;
  }

  async delete(id: string, userId: string): Promise<void> {
    const post = await this.findById(id);
    if (post.authorId !== userId) throw new ForbiddenException('Bu postu silemezsiniz.');
    await this.postsRepo.delete(id);
  }

  async like(id: string): Promise<void> {
    await this.postsRepo.increment({ id }, 'likesCount', 1);
  }

  async unlike(id: string): Promise<void> {
    await this.postsRepo.decrement({ id }, 'likesCount', 1);
  }

  async retweet(id: string): Promise<void> {
    await this.postsRepo.increment({ id }, 'retweetsCount', 1);
  }
}
