import { Injectable, Logger } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { RetryHttpService } from '../http/retry-http.service';

interface GetHtmlWithRetryProps {
    username: string;
    url: string;
    actionName: string;
    httpClient: AxiosInstance;
}
@Injectable()
export class ScarpingService {
    private readonly logger = new Logger(ScarpingService.name)
    constructor(private readonly retryHttpService: RetryHttpService) {}

    public async getHtmlWithRetry(
        props: GetHtmlWithRetryProps
    ): Promise<{data: string, userId: string} | null> {
        const { username, url, actionName, httpClient } = props
                const response = await this.retryHttpService.executeApiActionWithRetry<string>(
                    {
                        httpClient, 
                        config: { url: url, method: 'GET' }, 
                        username, 
                        actionName
                    }
                );
                if (response && response.status >= 400) {
                    this.logger.error(`[${actionName}] Failed to get HTML, received status ${response.status} for URL: ${url}`);
                    return null;
                }
                if(response) {
                    const userId = response.request?.res?.responseUrl.split('/')[4];
                    if (!userId) {
                        this.logger.error(`[${actionName}] Failed to extract userId from URL: ${response.request?.res?.responseUrl}`);
                        throw new Error(`Failed to extract userId from URL: ${response.request?.res?.responseUrl}`);
                    }
                    return {data: response.data, userId: userId }
                }
                return null
    
    }

    loadHtml(html: string): cheerio.CheerioAPI {
        return cheerio.load(html);
    }

    getHtmlElement(html: cheerio.CheerioAPI, selector: string) {
        if (!html) {
            throw new Error('HTML not loaded');
        }
        return html(selector);
    }

    //Selector is AnyNode type but it`s not available to import
    getHtmlAttribute(html: cheerio.CheerioAPI, selector: any, attribute: string) {
        if (!html) {
            throw new Error('HTML not loaded');
        }
        return html(selector).attr(attribute);
    }
}