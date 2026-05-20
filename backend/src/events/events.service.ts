import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';

export class CreateEventDto {
  title: string;
  description?: string;
  eventDate: Date;
  locationName?: string;
  latitude?: number;
  longitude?: number;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private readonly eventsRepo: Repository<Event>,
  ) {}

  async findAll(): Promise<Event[]> {
    return this.eventsRepo.find({ order: { eventDate: 'ASC' } });
  }

  async findUpcoming(): Promise<Event[]> {
    return this.eventsRepo
      .createQueryBuilder('event')
      .where('event.eventDate >= :now', { now: new Date() })
      .orderBy('event.eventDate', 'ASC')
      .take(10)
      .getMany();
  }

  async findById(id: string): Promise<Event> {
    const event = await this.eventsRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Etkinlik bulunamadı.');
    return event;
  }

  async create(organizerId: string, dto: CreateEventDto, imageUrl?: string): Promise<Event> {
    const event = this.eventsRepo.create({ ...dto, organizerId, imageUrl });
    return this.eventsRepo.save(event);
  }

  async delete(id: string): Promise<void> {
    await this.eventsRepo.delete(id);
  }
}
