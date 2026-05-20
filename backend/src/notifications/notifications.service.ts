import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

interface CreateNotificationInput {
  recipientId: string;
  actorId?: string;
  type: NotificationType;
  title: string;
  body?: string;
  entityId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly notificationsRepo: Repository<Notification>,
  ) {}

  async create(input: CreateNotificationInput): Promise<Notification | null> {
    if (input.actorId && input.actorId === input.recipientId) return null;
    const notification = this.notificationsRepo.create(input);
    return this.notificationsRepo.save(notification);
  }

  async findForUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepo.find({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationsRepo.count({
      where: { recipientId: userId, isRead: false },
    });
    return { count };
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationsRepo.update({ recipientId: userId, isRead: false }, { isRead: true });
  }
}
