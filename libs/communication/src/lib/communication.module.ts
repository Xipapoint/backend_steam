import { Module } from '@nestjs/common';
import { COMMUNICATION_PROVIDER_TOKEN } from './interfaces/CommunicationProvider/CommunicationProvider';
import { HttpCommunicationProvider } from './providers/HttpProvider/HttpProvider';

@Module({
  imports: [],
  providers: [
    {
      provide: COMMUNICATION_PROVIDER_TOKEN,
      useClass: HttpCommunicationProvider,
    },
  ],
  exports: [COMMUNICATION_PROVIDER_TOKEN],
})
export class CommunicationModule {}
