import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class AuthUtils {
    constructor(private readonly logger: Logger) {}
    async saveCookiesToFile(username: string, cookies: puppeteer.Cookie[]
    ): Promise<void> {
        const fs = require('fs').promises;
        const path = require('path');
        const cookiePath = path.join(__dirname, 'cookies', `${username}.json`)
        await fs.mkdir(path.dirname(cookiePath), { recursive: true });
        await fs.writeFile(cookiePath, JSON.stringify(cookies, null, 2));
        this.logger.log(`Cookies saved for user ${username}`);
    }

    async loadCookiesFromFile(username: string): Promise<puppeteer.Cookie[]> {
        const fs = require('fs').promises;
        const path = require('path');
        const cookiePath = path.join(__dirname, 'cookies', `${username}.json`);
        try {
            const cookiesJson = await fs.readFile(cookiePath, 'utf-8');
            this.logger.log(`Cookies loaded for user ${username}`);
            return JSON.parse(cookiesJson);
        } catch (error) {
            if (error.code === 'ENOENT') {
                this.logger.warn(`Cookie file not found for user ${username}. Starting fresh session.`);
                return [];
            }
            this.logger.error(`Error loading cookies for user ${username}:`, error);
            return []
        }
    }
}
