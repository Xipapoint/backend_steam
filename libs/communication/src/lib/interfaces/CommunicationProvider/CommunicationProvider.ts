export interface CommunicationProvider {
    send<TInput, TResult>(eventName: string, microserviceUrl: string, data: TInput): Promise<TResult>;
    publish<TInput>(eventName: string, microserviceUrl: string, data: TInput): Promise<void>;
}

export const COMMUNICATION_PROVIDER_TOKEN = "COMMUNICATION_PROVIDER"