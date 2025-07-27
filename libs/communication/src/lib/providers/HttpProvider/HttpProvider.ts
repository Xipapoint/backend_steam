import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from "axios";
import { CommunicationProvider, StatefulRequestOptions } from "../../interfaces";

@Injectable()
export class HttpCommunicationProvider implements CommunicationProvider {
  private readonly logger = new Logger(HttpCommunicationProvider.name);
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly DEFAULT_RETRY_DELAY = 2000;

  constructor(
    private readonly configService: ConfigService
  ) {}
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

      try {
        this.logger.log(
          `[Key: ${username}] [Task: ${path}] Attempt ${attempt}/${maxRetries} started.`,
        );

        
        const url = `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
        const response = await axios.post<TResult>(
          url,
          {},
          {
            headers: {
              'x-admin-token': "BJBrP510qOMHTFd",
              'x-username': username,
              'x-invite-code': inviteCode
            }
          }
        )

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