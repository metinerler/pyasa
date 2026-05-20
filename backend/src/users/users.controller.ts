import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { StorageService } from '../storage/storage.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Mevcut kullanıcı profili' })
  getMe(@Request() req: any) {
    return req.user;
  }

  @Patch('me')
  @ApiOperation({ summary: 'Profil güncelle' })
  updateMe(@Request() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.id, dto);
  }

  @Post('me/avatar')
  @ApiOperation({ summary: 'Avatar yükle (Huawei OBS)' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    const url = await this.storageService.uploadFile(file, `avatars/${req.user.id}`);
    return this.usersService.updateAvatar(req.user.id, url);
  }

  @Get('search')
  @ApiOperation({ summary: 'Kullanıcı ara' })
  search(@Query('q') q: string) {
    return this.usersService.search(q ?? '');
  }

  @Get(':username')
  @ApiOperation({ summary: 'Kullanıcı profilini getir' })
  getProfile(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }
}
