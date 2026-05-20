import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostReaction, PostReactionType } from './entities/post-reaction.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private readonly postsRepo: Repository<Post>,
    @InjectRepository(PostReaction) private readonly reactionsRepo: Repository<PostReaction>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(authorId: string, dto: CreatePostDto, imageUrl?: string): Promise<Post> {
    const post = this.postsRepo.create({ ...dto, authorId, imageUrl });
    return this.postsRepo.save(post);
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const posts = await this.postsRepo.find({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return this.withReactionState(posts, userId);
  }

  async findNearby(userId: string, lat: number, lon: number, radiusKm: number, page = 1, limit = 20) {
    const radiusDeg = radiusKm / 111;
    const posts = await this.postsRepo
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
    return this.withReactionState(posts, userId);
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

  async like(id: string, userId: string): Promise<void> {
    await this.addReaction(id, userId, 'like', 'likesCount');
  }

  async unlike(id: string, userId: string): Promise<void> {
    await this.removeReaction(id, userId, 'like', 'likesCount');
  }

  async retweet(id: string, userId: string): Promise<void> {
    await this.addReaction(id, userId, 'retweet', 'retweetsCount');
  }

  private async addReaction(
    postId: string,
    userId: string,
    type: PostReactionType,
    counter: 'likesCount' | 'retweetsCount',
  ): Promise<void> {
    await this.findById(postId);
    const existing = await this.reactionsRepo.findOne({ where: { postId, userId, type } });
    if (existing) return;

    await this.reactionsRepo.save(this.reactionsRepo.create({ postId, userId, type }));
    await this.postsRepo.increment({ id: postId }, counter, 1);

    const post = await this.findById(postId);
    await this.notificationsService.create({
      recipientId: post.authorId,
      actorId: userId,
      type,
      title: type === 'like' ? 'Yeni beğeni' : 'Yeni paylaşım',
      body: type === 'like' ? 'Gönderin beğenildi.' : 'Gönderin yeniden paylaşıldı.',
      entityId: postId,
    });
  }

  private async removeReaction(
    postId: string,
    userId: string,
    type: PostReactionType,
    counter: 'likesCount' | 'retweetsCount',
  ): Promise<void> {
    const existing = await this.reactionsRepo.findOne({ where: { postId, userId, type } });
    if (!existing) return;

    await this.reactionsRepo.delete(existing.id);
    const post = await this.findById(postId);
    if ((post[counter] ?? 0) > 0) {
      await this.postsRepo.decrement({ id: postId }, counter, 1);
    }
  }

  private async withReactionState(posts: Post[], userId: string) {
    if (posts.length === 0) return [];

    const postIds = posts.map((post) => post.id);
    const reactions = await this.reactionsRepo
      .createQueryBuilder('reaction')
      .where('reaction.userId = :userId', { userId })
      .andWhere('reaction.postId IN (:...postIds)', { postIds })
      .getMany();

    const liked = new Set(reactions.filter((r) => r.type === 'like').map((r) => r.postId));
    const retweeted = new Set(reactions.filter((r) => r.type === 'retweet').map((r) => r.postId));

    return posts.map((post) => ({
      ...post,
      isLiked: liked.has(post.id),
      isRetweeted: retweeted.has(post.id),
    }));
  }
}
