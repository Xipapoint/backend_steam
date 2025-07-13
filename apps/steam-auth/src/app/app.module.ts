import { CookiePersistenceModule } from '@backend/cookies';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { DBConfig } from './data-source';
import { PuppeteerModule } from './puppeteer/puppeteer.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PuppeteerModule,
    AuthModule,
    CookiePersistenceModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => DBConfig,
    }),
  ],
})
export class AppModule {}
