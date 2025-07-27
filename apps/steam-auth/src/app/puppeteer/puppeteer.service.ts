import { Inject, Injectable, Logger } from "@nestjs/common";
import fs from 'fs';
import path from "path";
import * as puppeteer from 'puppeteer';
import { TASK_NAMES } from "../shared/enums";
import { PuppeteerClient } from "./puppeteer.client";
import { COOKIE_PERSISTENCE_SERVICE, CookiePersistenceService } from "@backend/cookies";

const InitializingNewProcesses: Record<TASK_NAMES, boolean> = {
    [TASK_NAMES.typeSteamGuardCode]: false,
    [TASK_NAMES.loginWithAcception]: false,
    [TASK_NAMES.loginWithCookies]: false,
    [TASK_NAMES.monitorTrades]: false,
    [TASK_NAMES.login]: true
}

@Injectable()
export class PuppeteerService {
        private readonly logger = new Logger(PuppeteerService.name)
        private sessions: Map<string, puppeteer.BrowserContext> = new Map()
    constructor(
        @Inject(COOKIE_PERSISTENCE_SERVICE)
        private readonly cookiePersistence: CookiePersistenceService,
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
                    await context.setCookie(... (await this.cookiePersistence.loadCookies(username)))
                }
                const result = await taskFn(page);

                if (saveCookiesFn && result) {
                    this.logger.log(`[User: ${username}] Saving cookies...`);
                    console.log("cookies: ", context.cookies());
                    await this.cookiePersistence.saveCookies(username, await context.cookies());
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