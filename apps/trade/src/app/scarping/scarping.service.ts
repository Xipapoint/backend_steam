import { Injectable } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class ScarpingService {
    private html: cheerio.CheerioAPI
    constructor() {}

    public async getHtmlWithRetry(url: string, actionName: string, httpClient: AxiosInstance): Promise<{data: string, userId: string | undefined} | null> {
            try {
                const response = await this.executeApiActionWithRetry<string>(httpClient, { url: url, method: 'GET' }, actionName);
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
    
            } catch (error) {
                throw new Error(error)
            }
    }

    async loadHtml(html: string): Promise<cheerio.CheerioAPI> {
        this.html = cheerio.load(html);
        return this.html
    }

    async getHtmlElement(selector: string) {
        if (!this.html) {
            throw new Error('HTML not loaded');
        }
        return this.html(selector);
    }

    async getHtmlAttribute(selector: string, attribute: string) {
        if (!this.html) {
            throw new Error('HTML not loaded');
        }
        return this.html(selector).attr(attribute);
    }
}