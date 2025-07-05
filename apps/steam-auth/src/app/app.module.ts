import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from '@backend/database';
import { PuppeteerModule } from './puppeteer/puppeteer.module';
import { AuthModule } from './auth/auth.module';
import { CookiePersistenceModule } from '@backend/cookies';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PuppeteerModule,
    AuthModule,
    CookiePersistenceModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getTypeOrmConfig(__dirname),
    }),
  ],
})
export class AppModule {}
