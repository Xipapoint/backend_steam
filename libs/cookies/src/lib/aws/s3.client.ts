// libs/s3-client/src/lib/s3.client.service.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommandOutput,
  DeleteObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { S3_CLIENT } from './s3.config';

@Injectable()
export class S3ClientService {
  private readonly logger = new Logger(S3ClientService.name);
  private readonly bucket: string;

  constructor(
    @Inject(S3_CLIENT) private readonly s3: S3Client,
    private readonly configService: ConfigService,
  ) {
    this.bucket = this.configService.getOrThrow('AWS_S3_BUCKET');
  }

  /**
   * Загружает файл в S3 бакет.
   * @param key - Ключ (путь) к файлу в бакете.
   * @param body - Содержимое файла (Buffer, string или Readable stream).
   * @param contentType - MIME-тип файла.
   * @returns Promise с результатом операции PutObject.
   */
  async putObject(
    key: string,
    body: Buffer | string | Readable,
    contentType: string,
  ): Promise<PutObjectCommandOutput> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    try {
      const result = await this.s3.send(command);
      this.logger.log(`File uploaded successfully to ${key}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to upload file to ${key}`, error);
      throw error;
    }
  }

  /**
   * Получает файл из S3 бакета.
   * @param key - Ключ (путь) к файлу в бакете.
   * @returns Прочитанный файл в виде строки.
   */
  async getObject(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      const response = await this.s3.send(command);
      this.logger.log(`File successfully retrieved from ${key}`);
      if (!response.Body) {
        return null
      }
      return response.Body.transformToString('utf-8');
    } catch (error) {
      this.logger.error(`Failed to retrieve file from ${key}`, error);
      throw error;
    }
  }

  /**
   * Удаляет файл из S3 бакета.
   * @param key - Ключ (путь) к файлу в бакете.
   * @returns Promise с результатом операции DeleteObject.
   */
  async deleteObject(key: string): Promise<DeleteObjectCommandOutput> {
     const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      const result = await this.s3.send(command);
      this.logger.log(`File deleted successfully from ${key}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete file from ${key}`, error);
      throw error;
    }
  }
}