import { Module } from '@nestjs/common';
import { CommunicationModule } from '@backend/communication'
@Module({
  imports: [CommunicationModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
