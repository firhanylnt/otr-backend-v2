import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { R2StorageService } from './r2-storage.service';
import { memoryStorage } from 'multer';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly r2: R2StorageService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpg|jpeg|png|webp|gif)$/)) {
          return cb(new BadRequestException('Only image files are allowed (jpg, jpeg, png, webp, gif)'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiOperation({ summary: 'Upload an image to Cloudflare R2' })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!file.buffer) {
      throw new BadRequestException('File buffer is missing');
    }

    const url = await this.r2.upload(
      file.buffer,
      'images',
      file.mimetype,
      file.originalname,
    );

    return {
      success: true,
      url,
      filename: file.originalname,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Post('audio')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'audio/mpeg',
          'audio/mp3',
          'audio/wav',
          'audio/x-wav',
          'audio/wave',
          'audio/ogg',
          'audio/flac',
          'audio/aac',
          'audio/m4a',
          'audio/x-m4a',
        ];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(new BadRequestException(`Only audio files are allowed. Received: ${file.mimetype}`), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    }),
  )
  @ApiOperation({ summary: 'Upload an audio file to Cloudflare R2' })
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!file.buffer) {
      throw new BadRequestException('File buffer is missing');
    }

    const url = await this.r2.upload(
      file.buffer,
      'audio',
      file.mimetype,
      file.originalname,
    );

    return {
      success: true,
      url,
      filename: file.originalname,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
