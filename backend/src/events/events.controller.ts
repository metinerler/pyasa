import {
  Controller, Get, Post, Delete, Param, Body, UseGuards,
  Request, UploadedFile, UseInterceptors, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventsService, CreateEventDto } from './events.service';
import { StorageService } from '../storage/storage.service';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Tüm etkinlikler' })
  findAll() { return this.eventsService.findAll(); }

  @Get('upcoming')
  @ApiOperation({ summary: 'Yaklaşan etkinlikler' })
  findUpcoming() { return this.eventsService.findUpcoming(); }

  @Get(':id')
  @ApiOperation({ summary: 'Etkinlik detayı' })
  findById(@Param('id', ParseUUIDPipe) id: string) { return this.eventsService.findById(id); }

  @Post()
  @ApiOperation({ summary: 'Etkinlik oluştur' })
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Request() req: any,
    @Body() dto: CreateEventDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    let imageUrl: string | undefined;
    if (image) imageUrl = await this.storageService.uploadFile(image, `events/${req.user.id}`);
    return this.eventsService.create(req.user.id, dto, imageUrl);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Etkinlik sil' })
  delete(@Param('id', ParseUUIDPipe) id: string) { return this.eventsService.delete(id); }
}
