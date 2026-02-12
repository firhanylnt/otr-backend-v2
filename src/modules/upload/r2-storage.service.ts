import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

@Injectable()
export class R2StorageService {
  private readonly client: S3Client | null = null;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly enabled: boolean;

  constructor(private config: ConfigService) {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucket = this.config.get<string>('R2_BUCKET_NAME', '');
    this.publicUrl = (this.config.get<string>('R2_PUBLIC_URL') || '').replace(
      /\/$/,
      '',
    );

    this.enabled = !!(accountId && accessKeyId && secretAccessKey && this.bucket && this.publicUrl);

    if (this.enabled && accountId && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true,
      });
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Upload buffer to R2 and return public URL.
   * @param buffer File buffer
   * @param folder e.g. 'images' or 'audio'
   * @param mimeType Content-Type
   * @param originalName Original filename (for extension)
   */
  async upload(
    buffer: Buffer,
    folder: string,
    mimeType: string,
    originalName?: string,
  ): Promise<string> {
    if (!this.client || !this.enabled) {
      throw new Error(
        'R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL in .env',
      );
    }

    const ext = originalName ? extname(originalName) : this.getExtFromMime(mimeType);
    const key = `${folder}/${uuidv4()}${ext}`;

    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    };

    await this.client.send(new PutObjectCommand(params));

    return `${this.publicUrl}/${key}`;
  }

  private getExtFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'audio/mpeg': '.mp3',
      'audio/mp3': '.mp3',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg',
      'audio/flac': '.flac',
      'audio/aac': '.aac',
      'audio/x-m4a': '.m4a',
      'audio/m4a': '.m4a',
    };
    return map[mime] || '';
  }
}
