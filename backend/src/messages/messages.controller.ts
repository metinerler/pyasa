import {
  Controller, Get, Post, Body, Param, UseGuards, Request, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';

class SendMessageDto {
  @IsString() receiverId: string;
  @IsString() @MaxLength(1000) content: string;
}

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Konuşma listesi' })
  getList(@Request() req: any) {
    return this.messagesService.getConversationList(req.user.id);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Kullanıcıyla konuşma' })
  getConversation(@Request() req: any, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.messagesService.getConversation(req.user.id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Mesaj gönder' })
  send(@Request() req: any, @Body() dto: SendMessageDto) {
    return this.messagesService.send(req.user.id, dto.receiverId, dto.content);
  }

  @Post(':userId/read')
  @ApiOperation({ summary: 'Mesajları okundu olarak işaretle' })
  markRead(@Request() req: any, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.messagesService.markRead(userId, req.user.id);
  }
}
