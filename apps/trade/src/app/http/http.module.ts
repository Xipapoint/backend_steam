import { Module } from '@nestjs/common';
import { HttpClientService } from './http-client.service';
import { RetryHttpService } from './retry-http.service';
import { CookiePersistenceModule } from '@backend/cookies';
import { ProxyModule } from '../proxies/proxies.module';

@Module({
  imports: [CookiePersistenceModule, ProxyModule],
  providers: [HttpClientService, RetryHttpService],
  exports: [HttpClientService, RetryHttpService],
})
export class HttpModule {}
