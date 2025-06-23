import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { COMMUNICATION_PROVIDER_TOKEN } from './interfaces/CommunicationProvider/CommunicationProvider';
import { HttpProvider } from './providers/HttpProvider/HttpProvider';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: COMMUNICATION_PROVIDER_TOKEN,
      useClass: HttpProvider,
    },
  ],
  exports: [],
})
export class CommunicationModule {}
