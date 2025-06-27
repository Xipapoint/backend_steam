import { CookiePersistenceService } from "@backend/communication";
import { Injectable, Logger } from "@nestjs/common";
import * as puppeteer from 'puppeteer';
import { Cookie, CookieJar, CreateCookieOptions } from "tough-cookie";
@Injectable()
export class FileCookiePersistenceService implements CookiePersistenceService {
    private readonly logger = new Logger(FileCookiePersistenceService.name);

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

    async load(username: string, jar: CookieJar): Promise<void> {
        try {
            const puppeteerCookies: puppeteer.Cookie[] = await this.loadCookiesFromFile(username);

            if (puppeteerCookies && puppeteerCookies.length > 0) {
                let loadedCount = 0;
                for (const pCookie of puppeteerCookies) {
                    if (!pCookie.name || !pCookie.domain) continue;
                    const expiresDate = (pCookie.expires && pCookie.expires !== -1)
                        ? new Date(pCookie.expires * 1000)
                        : "Infinity";
                    const cookieProps: CreateCookieOptions = {
                        key: pCookie.name, value: pCookie.value,
                        domain: pCookie.domain.replace(/^\./, ''), path: pCookie.path || '/',
                        expires: expiresDate,
                        httpOnly: pCookie.httpOnly || false,
                        secure: pCookie.secure || false, sameSite: pCookie.sameSite
                    };
                    const url = `https://${cookieProps.domain}${cookieProps.path}`;
                    try {
                        const tCookie = new Cookie(cookieProps);
                        await jar.setCookie(tCookie, url);
                        loadedCount++;
                    } catch (cookieError: any) {
                        this.logger.warn(`[User: ${username}] Failed to set cookie "${pCookie.name}" from domain "${pCookie.domain}" into jar: ${cookieError.message}`);
                    }
                }
                this.logger.log(`[User: ${username}] ${loadedCount}/${puppeteerCookies.length} cookies loaded into jar.`);
            } else {
                this.logger.log(`[User: ${username}] No cookies found in file to load.`);
            }
        } catch (error: any) {
            this.logger.warn(`[User: ${username}] Error during cookie loading process: ${error.message}. Starting fresh session might occur.`);
        }
    }
    async save(username: string, jar: CookieJar): Promise<void> {
try {
            const relevantDomains = ['steamcommunity.com', 'store.steampowered.com'];
            const puppeteerCookiesOutput: puppeteer.Cookie[] = [];
            for (const domain of relevantDomains) {
                try {
                    const toughCookies: Cookie[] = await jar.getCookies(`https://${domain}/`, { allPaths: true });
                    for (const tCookie of toughCookies) {
                        const isSession = tCookie.expires === "Infinity" || !tCookie.expires;
                        const pCookie: puppeteer.Cookie = {
                            name: tCookie.key, value: tCookie.value, domain: tCookie.domain,
                            path: tCookie.path || '/',
                            expires: isSession || !tCookie.expires ? -1 : Math.floor((tCookie.expires as Date).getTime() / 1000),
                            httpOnly: tCookie.httpOnly || false, secure: tCookie.secure || false,
                            session: isSession, sameSite: tCookie.sameSite as puppeteer.Cookie['sameSite'] || 'None',
                            size: tCookie.value.length + tCookie.key.length
                        };
                        puppeteerCookiesOutput.push(pCookie);
                    }
                } catch (getCookieError: any) {
                    this.logger.warn(`[User: ${username}] Error getting cookies for domain ${domain} from jar: ${getCookieError.message}`);
                }
            }
            if (puppeteerCookiesOutput.length > 0) {
                await this.saveCookiesToFile(username, puppeteerCookiesOutput);
            } else {
                this.logger.log(`[User: ${username}] No relevant cookies found in jar to save.`);
            }
        } catch (error: any) {
            this.logger.error(`[User: ${username}] Failed to save cookies from jar: ${error.message}`);
        }
    }

}