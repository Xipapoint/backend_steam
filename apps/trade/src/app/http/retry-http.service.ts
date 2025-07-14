import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { HttpClientService } from "./http-client.service";

@Injectable()
export class RetryHttpService {
  private readonly logger = new Logger(RetryHttpService.name);

  constructor(
    private readonly httpClientService: HttpClientService,
  ) {}

async executeApiActionWithRetry<T = any>(
        httpClient: AxiosInstance,
        config: AxiosRequestConfig,
        username: string,
        actionName: string,
        currentRetry = 0
    ): Promise<AxiosResponse<T> | void> {
        this.logger.debug(`[${actionName}] Attempting API action (Retry ${currentRetry}). URL: ${config.method || 'GET'} ${config.url} and name: ${actionName}`);
        
        try {
            const response = await httpClient.request<T>(config);
            if (response.status === 429) {
                const rateLimitError = new AxiosError(
                    `Rate Limit Detected (429) for ${actionName}`,
                    '429',
                    response.config,
                    response.request,
                    response
                );
                rateLimitError.isAxiosError = true;
                throw rateLimitError;
            }
            if (response.status >= 400) {
                this.logger.warn(`[${actionName}] API action returned status ${response.status}. URL: ${config.url}`);
                const error = new AxiosError(
                    `API action failed with status ${response.status}`,
                    response.status.toString(),
                        response.config,
                        response.request,
                        response
                );
                error.isAxiosError = true;
                throw error;
                }

            this.logger.debug(`[${actionName}] API action successful (Status ${response.status}).`);
            return response;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 429) {
                        const { httpClient } = await this.httpClientService.createHttpProxyClient(username)
                        this.logger.warn(`[${actionName}] Action failed due to rate limit (429). Changed http client`);
                        return this.executeApiActionWithRetry<T>(httpClient, config, actionName, username, currentRetry + 1);
                }
            } else {
                    this.logger.error(`[${actionName}] Action failed with non-429 Axios error: ${error.message}. Status: ${error.response?.status}. URL: ${config.url}`);
                    throw error;
                }
            }
        }
}

