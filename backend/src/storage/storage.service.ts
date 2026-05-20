import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Huawei OBS SDK
const ObsClient = require('esdk-obs-nodejs');

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly obsClient: any;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get<string>('OBS_BUCKET');
    this.endpoint = config.get<string>('OBS_ENDPOINT');

    this.obsClient = new ObsClient({
      access_key_id: config.get<string>('OBS_ACCESS_KEY'),
      secret_access_key: config.get<string>('OBS_SECRET_KEY'),
      server: this.endpoint,
    });
  }

  /**
   * Dosyayı Huawei OBS'e yükler ve public URL döner.
   * @param file   Multer dosyası
   * @param prefix OBS içindeki klasör adı (örn: 'avatars/user-id')
   */
  async uploadFile(file: Express.Multer.File, prefix: string): Promise<string> {
    const firstBytes = file.buffer.subarray(0, 16).toString('hex');
    this.logger.log(`Uploading ${file.originalname} (${file.mimetype}, ${file.size} bytes): ${firstBytes}`);

    if (firstBytes.startsWith('efbfbd')) {
      throw new BadRequestException('Gelen dosya bozuk görünüyor. Lütfen fotoğrafı tekrar seçip yükleyin.');
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const objectKey = `${prefix}/${uuidv4()}${ext}`;
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pyassa-upload-'));
    const tempFile = path.join(tempDir, `${uuidv4()}${ext}`);

    await fs.writeFile(tempFile, file.buffer);

    try {
      const upload = this.obsClient.putObject({
        Bucket: this.bucket,
        Key: objectKey,
        SourceFile: tempFile,
        ContentType: file.mimetype,
        ACL: 'public-read',
      });

      const result = await Promise.race([
        upload,
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('OBS upload timed out.')), 30000);
        }),
      ]) as any;

      if (result?.CommonMsg?.Status >= 300) {
        this.logger.error('OBS upload failed', result?.CommonMsg);
        throw new InternalServerErrorException('Dosya yüklenemedi.');
      }

      // Huawei OBS public URL: https://<bucket>.<endpoint-host>/<key>
      const host = this.endpoint.replace(/^https?:\/\//, '');
      return `https://${this.bucket}.${host}/${objectKey}`;
    } catch (err) {
      this.logger.error('OBS upload failed', err);
      throw new InternalServerErrorException('Dosya yüklenemedi.');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  /**
   * OBS'ten dosya sil.
   */
  async deleteFile(objectKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.obsClient.deleteObject(
        { Bucket: this.bucket, Key: objectKey },
        (err: any, result: any) => {
          if (err || result?.CommonMsg?.Status >= 300) {
            this.logger.error('OBS delete failed', err ?? result?.CommonMsg);
            return reject(new InternalServerErrorException('Dosya silinemedi.'));
          }
          resolve();
        },
      );
    });
  }

  /**
   * OBS URL'inden object key çıkar.
   */
  extractObjectKey(url: string): string {
    const host = this.endpoint.replace(/^https?:\/\//, '');
    return url.replace(`https://${this.bucket}.${host}/`, '');
  }
}
