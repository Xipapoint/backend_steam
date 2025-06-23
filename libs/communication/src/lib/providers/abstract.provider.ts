import { CommunicationProvider } from '../interfaces/CommunicationProvider/CommunicationProvider';
import { catchError, EMPTY, firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';


export abstract class AbstractProvider implements CommunicationProvider {
    private readonly logger: Logger = new Logger(AbstractProvider.name)
    constructor(private readonly httpService: HttpService) {}

    async send<TInput, TResult>(eventName: string, microserviceUrl: string, data: TInput): Promise<TResult> {
        const url = `${microserviceUrl}/${eventName}`;
        
        try {
            const response = await firstValueFrom(
                this.httpService.post<TResult>(url, data)
            );
            return response.data
        } catch (error) {
            console.error('HTTP communication error:', error);
            throw error;
        }
    }

    async publish<TInput>(eventName: string, microserviceUrl: string, data: TInput): Promise<void> {
        const url = `${microserviceUrl}/${eventName}`;
        this.httpService
        .post<void>(url, data)
        .pipe(
            catchError(err => {
            this.logger.error('Error in publish communication layer detected:', err);
            return EMPTY;
            })
        )
        .subscribe();
    }
}