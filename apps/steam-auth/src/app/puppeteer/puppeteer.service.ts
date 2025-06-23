import { Injectable, Logger } from "@nestjs/common";
import fs from 'fs';
import path from "path";
import * as puppeteer from 'puppeteer';
import { Cookie, CookieJar, CreateCookieOptions } from "tough-cookie";
import { TASK_NAMES } from "../shared/enums";
import { PuppeteerClient } from "./puppeteer.client";
import { AuthUtils } from "./utils";

const InitializingNewProcesses: Record<TASK_NAMES, boolean> = {
    [TASK_NAMES.typeSteamGuardCode]: false,
    [TASK_NAMES.loginWithAcception]: false,
    [TASK_NAMES.loginWithCookies]: false,
    [TASK_NAMES.monitorTrades]: false,
    [TASK_NAMES.login]: true
}

@Injectable()
export class PuppeteerService {
    constructor(
        private readonly logger: Logger, 
        private readonly authUtils: AuthUtils,
        private sessions: Map<string, puppeteer.BrowserContext> = new Map(),
        private readonly browserClient: PuppeteerClient,
    ) {}
    private async initializeNewProcess(username: string, context: puppeteer.BrowserContext | null, page: puppeteer.Page | null) {
        const browserClient = await this.browserClient.getBrowser();
        context = await browserClient.createBrowserContext();
        page = await context.newPage();
        this.sessions.set(username, context);
        return { context, page, browserClient };
    }

    /**
     * Выполняет задачу Puppeteer с логикой повторных попыток.
     * @param username Имя пользователя (для логирования и потенциально для cookies)
     * @param taskName Название задачи (для логирования)
     * @param taskFn Асинхронная функция, принимающая page и context, выполняющая основную логику Puppeteer.
     * @param loadCookiesFn Опциональная функция для загрузки cookies.
     * @param saveCookiesFn Опциональная функция для сохранения cookies.
     * @returns Результат выполнения taskFn
     */
    async executePuppeteerTask<T>(
        username: string,
        taskName: TASK_NAMES,
        taskFn: (page: puppeteer.Page) => Promise<T>,
        loadCookiesFn?: (page: puppeteer.Page, username: string) => Promise<void>,
        saveCookiesFn?: (page: puppeteer.Page, username: string) => Promise<void>,
        initializeNewProcess: boolean = InitializingNewProcesses[taskName]
    ): Promise<T> {
            let context: puppeteer.BrowserContext | null = null;
            let page: puppeteer.Page | null = null;    
            try {
                if(initializeNewProcess){
                    ({ context, page } = await this.initializeNewProcess(username, context, page));
                    this.logger.log("Created new context and page: ", context, page)
                }
                else {
                    context = this.sessions.get(username) as puppeteer.BrowserContext;
                    if (!context) {
                        throw new Error(`No browserClient context found for user ${username}.`);
                    }
                    page = await context.pages().then(pages => pages[0]);
                    if(!page) {
                        throw new Error(`No page found for user ${username}.`);
                    }
                }
                if (loadCookiesFn) {
                    this.logger.log(`[User: ${username}] Loading cookies...`);
                    await page.setCookie(... (await this.authUtils.loadCookiesFromFile(username)))
                }
                const result = await taskFn(page);

                if (saveCookiesFn && result) {
                    this.logger.log(`[User: ${username}] Saving cookies...`);
                    await this.authUtils.saveCookiesToFile(username, await page.cookies());
                }
                this.logger.log(`[User: ${username}] [Task: ${taskName}] successful.`);
                return result;
            } catch (error: any) {
                this.logger.error(`[User: ${username}] [Task: ${taskName}] failed: ${error.message}`, error.stack);
                if(this.sessions.get(username)) {
                    try { await context?.close(); } catch (closeErr: any) { this.logger.error(`Error closing context during retry cleanup: ${closeErr.message}`); }
                    this.sessions.delete(username);
                    this.logger.error(`[Session successfully deleted for User: ${username}] in [Task: ${taskName}]`);
                } 
                throw error
            } finally {
                if(taskName !== TASK_NAMES.login) {
                    if (context) {
                        try { await context?.close(); } catch (closeErr: any) { this.logger.error(`Error closing context during retry cleanup: ${closeErr.message}`); }
                        this.sessions.delete(username)
                    }
                }
            }
    }

    async loadCookiesIntoJar(jar: CookieJar, username: string): Promise<void> {
            try {
                const puppeteerCookies: puppeteer.Cookie[] = await this.authUtils.loadCookiesFromFile(username);
    
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
    
    async saveCookiesFromJar(jar: CookieJar, username: string): Promise<void> {
            try {
                const relevantDomains = ['steamcommunity.com', 'store.steampowered.com'];
                const puppeteerCookiesOutput: puppeteer.Cookie[] = [];
                for (const domain of relevantDomains) {
                    try {
                        const toughCookies: Cookie[] = await jar.getCookies(`https://${domain}/`, { allPaths: true });
                        for (const tCookie of toughCookies) {
                            const isSession = tCookie.expires === "Infinity" || !tCookie.expires;
                            const pCookie: puppeteer.Cookie = {
                                name: tCookie.key, value: tCookie.value, domain: tCookie.domain!,
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
                    await this.authUtils.saveCookiesToFile(username, puppeteerCookiesOutput);
                } else {
                    this.logger.log(`[User: ${username}] No relevant cookies found in jar to save.`);
                }
            } catch (error: any) {
                this.logger.error(`[User: ${username}] Failed to save cookies from jar: ${error.message}`);
            }
    }

    async getBrowserContext(username: string): Promise<puppeteer.BrowserContext> {
        if (!this.browserClient) {
            await this.browserClient.getBrowser();
        }
        return this.sessions.get(username) || null;
    }

    async createContext(username: string): Promise<puppeteer.BrowserContext> {
        if (!this.browserClient) {
            await this.browserClient.getBrowser();
        }
        if (this.sessions.has(username)) {
            this.logger.warn(`Context for user ${username} already exists. Reusing existing context.`);
            return this.sessions.get(username);
        }
        const context = await this.browserClient.getNewContext();
        this.sessions.set(username, context);
        this.logger.log(`Created new browserClient context for user: ${username}`);
        return context;
    }

    async deleteContext(username: string): Promise<void> {
        const context = this.sessions.get(username);
        if (context) {
            try {
                await this.browserClient.deleteContext(context);
                this.sessions.delete(username);
                this.logger.log(`Deleted browserClient context for user: ${username}`);
            } catch (error) {
                this.logger.error(`Failed to delete browserClient context for user ${username}:`, error);
                throw error
            }
        } else {
            this.logger.warn(`No browserClient context found for user ${username}.`);
        }
    }

    async deleteCookies(username: string): Promise<boolean> {
        const cookieFilePath = path.join(__dirname, "cookies", "${username}.json");
        if (fs.existsSync(cookieFilePath)) {
            fs.unlinkSync(cookieFilePath);
            this.logger.log(`Cookies for user ${username} deleted.`);
            return true
        } else {
            this.logger.warn(`No cookies file found for user ${username}.`);
            return false
        }
    }


}