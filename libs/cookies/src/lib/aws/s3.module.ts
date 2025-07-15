import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3'
import { S3_CLIENT } from "./s3.config";
import { S3ClientService } from "./s3.client";

@Module({})
export class S3ClientModule {
  static forRoot(): DynamicModule {
    const s3ClientProvider = {
      provide: S3_CLIENT,
      useFactory: (configService: ConfigService): S3Client => {
        return new S3Client({
          region: configService.getOrThrow('AWS_S3_REGION'),
          credentials: {
            accessKeyId: configService.getOrThrow('AWS_ACCESS_KEY_ID'),
            secretAccessKey: configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
          },
        });
      },
      inject: [ConfigService],
    };

    return {
      module: S3ClientModule,
      imports: [ConfigModule],
      providers: [s3ClientProvider, S3ClientService],
      exports: [S3ClientService],
      global: true,
    };
  }
}