import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { COMMUNICATION_PROVIDER_TOKEN } from './interfaces/CommunicationProvider/CommunicationProvider';
import { HttpCommunicationProvider } from './providers/HttpProvider/HttpProvider';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: COMMUNICATION_PROVIDER_TOKEN,
      useClass: HttpCommunicationProvider,
    },
  ],
  exports: [COMMUNICATION_PROVIDER_TOKEN],
})
export class CommunicationModule {}
