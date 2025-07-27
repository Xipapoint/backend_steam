// src/auth/login-event.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Subject } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { CommunicationProvider } from '@backend/communication';

interface LoginEventPayload {
  username: string;
  inviteCode: string;
}

@Injectable()
export class LoginEventService implements OnModuleInit {
  private readonly subject = new Subject<LoginEventPayload>();
  private readonly logger = new Logger(LoginEventService.name);

  constructor(
    private readonly httpCommunicationProvider: CommunicationProvider,
    private readonly configService: ConfigService
  ) {}

onModuleInit() {
    this.subject.subscribe(({ username, inviteCode }) => {
        const baseUrl = this.configService.getOrThrow<string>('TRADE_SERVICE_URL');
        this.httpCommunicationProvider.sendWithState({
            baseUrl,
            path: '/trade/monitor-trades',
            username,
            inviteCode,
        }).catch(err => {
            this.logger.error(`Failed to send login event for user ${username}: ${err.message}`, err.stack);
            throw err;
        });
    });
}

  publishLoginEvent(username: string, inviteCode: string) {
    this.subject.next({ username, inviteCode });
  }
}
