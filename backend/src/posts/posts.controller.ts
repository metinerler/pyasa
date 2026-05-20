import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from './posts.service';
import { StorageService } from '../storage/storage.service';
import { CreatePostDto } from './dto/create-post.dto';

@ApiTags('Posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Tüm postları listele' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Request() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.postsService.findAll(req.user.id, Number(page), Number(limit));
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Yakındaki postları getir' })
  @ApiQuery({ name: 'lat', required: true })
  @ApiQuery({ name: 'lon', required: true })
  @ApiQuery({ name: 'radius', required: false, description: 'km cinsinden' })
  findNearby(
    @Request() req: any,
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('radius') radius = '10',
    @Query('page') page = 1,
  ) {
    return this.postsService.findNearby(
      req.user.id,
      parseFloat(lat),
      parseFloat(lon),
      parseFloat(radius),
      Number(page),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Yeni post oluştur' })
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Request() req: any,
    @Body() dto: CreatePostDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    let imageUrl: string | undefined;
    if (image) {
      imageUrl = await this.storageService.uploadFile(image, `posts/${req.user.id}`);
    }
    return this.postsService.create(req.user.id, dto, imageUrl);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Post sil' })
  delete(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.postsService.delete(id, req.user.id);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Post beğen' })
  like(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.postsService.like(id, req.user.id);
  }

  @Post(':id/unlike')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Beğeniyi geri al' })
  unlike(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.postsService.unlike(id, req.user.id);
  }

  @Post(':id/retweet')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Retweet' })
  retweet(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.postsService.retweet(id, req.user.id);
  }
}
