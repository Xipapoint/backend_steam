import { Logger } from "@nestjs/common";
import { CustomPromiseTimeout } from "../CustomPromiseTimeout/CustomPromiseTimout";
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

export abstract class ExecuteApiActions {

        /**
         * Выполняет сетевой запрос с помощью Axios с обработкой rate limit (429).
         * @param config Конфигурация запроса Axios (url, method, data, etc.)
         * @param actionName Имя действия для логирования.
         * @param currentRetry Текущая попытка (для рекурсии/итерации).
         * @returns Promise с результатом AxiosResponse в случае успеха.
         * @throws AxiosError если ошибка не связана с rate limit или превышено число попыток.
         */
    async executeApiActionWithRetry<T = any>(
        httpClient: AxiosInstance,
        config: AxiosRequestConfig,
        actionName: string,
        logger: Logger,
        currentRetry = 0
    ): Promise<AxiosResponse<T> | void> {
        logger.debug(`[${actionName}] Attempting API action (Retry ${currentRetry}). URL: ${config.method || 'GET'} ${config.url} and name: ${actionName}`);
        
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
                logger.warn(`[${actionName}] API action returned status ${response.status}. URL: ${config.url}`);
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

            logger.debug(`[${actionName}] API action successful (Status ${response.status}).`);
            return response;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 429) {
                        const waitSeconds = (Math.pow(2, currentRetry) * 5) + Math.random() * 2; // Пример: 5s, 10s, 20s, 40s, 80s + random
                        logger.warn(`[${actionName}] Action failed due to rate limit (429). Waiting ${waitSeconds.toFixed(1)} seconds before retry ${currentRetry + 1} URL: ${config.url}`);
                        await CustomPromiseTimeout(waitSeconds * 1000);
                        return this.executeApiActionWithRetry<T>(httpClient, config, actionName, logger, currentRetry + 1);
                }
            } else {
                    logger.error(`[${actionName}] Action failed with non-429 Axios error: ${error.message}. Status: ${error.response?.status}. URL: ${config.url}`);
                    throw error;
                }
            }
    }


}

