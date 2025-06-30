import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PuppeteerModule } from './puppeteer/puppeteer.module';
import { AuthModule } from './auth/auth.module';
import { CookiePersistenceModule } from './cookies-persistance/cookies-persistance.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PuppeteerModule,
    AuthModule,
    CookiePersistenceModule,
  ],
})
export class AppModule {}
