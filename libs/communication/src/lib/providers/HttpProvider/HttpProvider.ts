import { Inject, Injectable, Logger } from "@nestjs/common";
import axios, { AxiosError } from "axios";
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from "tough-cookie";
import { CookiePersistenceService, StatefulRequestOptions, TradeTaskRequest } from "../../interfaces";
import { ConfigService } from '@nestjs/config';

export const COOKIE_PERSISTENCE_SERVICE = 'COOKIE_PERSISTENCE_SERVICE';

@Injectable()
export class HttpCommunicationProvider {
  private readonly logger = new Logger(HttpCommunicationProvider.name);
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly DEFAULT_RETRY_DELAY = 2000;

  constructor(
    @Inject(COOKIE_PERSISTENCE_SERVICE)
    private readonly cookiePersistence: CookiePersistenceService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Отправляет запрос к другому микросервису, управляя сессией (cookie) и ретраями.
   * Аналог вашего `executeHttpTask`.
   */
  public async sendWithState<TResult>(
    options: StatefulRequestOptions,
  ): Promise<TResult> {
    const {
      baseUrl,
      path,
      username,
      inviteCode,
      maxRetries = this.DEFAULT_MAX_RETRIES,
      retryDelay = this.DEFAULT_RETRY_DELAY,
    } = options;

    let retries = maxRetries;
    let lastError: Error | null = null;

    while (retries > 0) {
      const attempt = maxRetries - retries + 1;
      const jar = new CookieJar();
      const httpClient = wrapper(axios.create({ jar }));

      try {
        this.logger.log(
          `[Key: ${username}] [Task: ${path}] Attempt ${attempt}/${maxRetries} started.`,
        );

        await this.cookiePersistence.load(username, jar);

        const response = await axios.post<TResult>(
          `${baseUrl}/${path}`, 
          {
            jar,
            httpClient,
            username,
            inviteCode
          } as TradeTaskRequest,
          {
            headers: {
              'x-admin-token': this.configService.getOrThrow<string>('ADMIN_TOKEN'),
            }
          }
        )

        await this.cookiePersistence.save(username, jar);

        this.logger.log(
          `[Key: ${username}] [Task: ${path}] Attempt ${attempt} successful.`,
        );
        return response.data;
      } catch (error: any) {
        lastError = error;
        let errorMessage = error.message;

        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          const statusCode = axiosError.response?.status;
          errorMessage = `AxiosError: ${error.message} (Status: ${statusCode ?? 'N/A'})`;
        }
        this.logger.error(
          `[Key: ${username}] [Task: ${path}] Attempt ${attempt} failed: ${errorMessage}`,
          error.stack,
        );

        retries--;
        this.logger.warn(
          `[Key: ${username}] [Task: ${path}] Retries left: ${retries}`,
        );
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          this.logger.log(
            `[Key: ${username}] [Task: ${path}] Retrying...`,
          );
        }
      }
    }

    this.logger.error(
      `[Key: ${username}] [Task: ${path}] Failed after ${maxRetries} attempts.`,
    );
    throw (
      lastError ??
      new Error(
        `Task ${path} failed for key ${username} after ${maxRetries} attempts.`,
      )
    );
  }
}