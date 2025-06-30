import { StatefulRequestOptions } from "../StatefulRequestOptions/StatefulRequestOptions"

export interface CommunicationProvider {
    sendWithState<TResult>(
        options: StatefulRequestOptions,
    ): Promise<TResult>
}

export const COMMUNICATION_PROVIDER_TOKEN = "COMMUNICATION_PROVIDER"