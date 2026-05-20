import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private readonly messagesRepo: Repository<Message>,
  ) {}

  async send(senderId: string, receiverId: string, content: string, mediaUrl?: string): Promise<Message> {
    const msg = this.messagesRepo.create({ senderId, receiverId, content, mediaUrl });
    return this.messagesRepo.save(msg);
  }

  async getConversation(userA: string, userB: string): Promise<Message[]> {
    return this.messagesRepo
      .createQueryBuilder('msg')
      .where(
        '(msg.senderId = :a AND msg.receiverId = :b) OR (msg.senderId = :b AND msg.receiverId = :a)',
        { a: userA, b: userB },
      )
      .orderBy('msg.createdAt', 'ASC')
      .getMany();
  }

  async getConversationList(userId: string) {
    return this.messagesRepo
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.sender', 'sender')
      .leftJoinAndSelect('msg.receiver', 'receiver')
      .where('msg.senderId = :uid OR msg.receiverId = :uid', { uid: userId })
      .orderBy('msg.createdAt', 'DESC')
      .getMany();
  }

  async markRead(senderId: string, receiverId: string): Promise<void> {
    await this.messagesRepo.update({ senderId, receiverId, isRead: false }, { isRead: true });
  }
}
