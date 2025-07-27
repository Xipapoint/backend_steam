import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as puppeteer from 'puppeteer';



@Injectable()
export class PuppeteerClient implements OnModuleInit {
  private browser: puppeteer.Browser | null = null;
  private readonly logger = new Logger(PuppeteerClient.name);

  constructor(private readonly configService: ConfigService) {}
    private async initBrowser() {
        this.logger.log("Initializing browser...");
        try {
            const BROWSER_CONFIG: puppeteer.LaunchOptions = {
                headless: false,
                args: [
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                ],
                userDataDir: `./tmp/puppeteer_profile_${Date.now()}`
            }
            this.browser = await puppeteer.launch(BROWSER_CONFIG);
            this.logger.log("Browser initialized successfully.");
            this.browser.on('disconnected', () => {
                this.logger.warn('Browser disconnected. Need to re-initialize.');
                this.browser?.close()
                this.browser = null;
            });
        } catch (error) {
            this.logger.error("Failed to launch browser:", error);
            this.browser = null;
        }
    }
    async ensureBrowserInitialized(): Promise<puppeteer.Browser> {
        if (!this.browser || !this.browser.connected) {
            this.logger.warn('Browser not initialized or disconnected. Re-initializing...');
            await this.initBrowser();
        }
        if (!this.browser) {
            throw new Error("Failed to initialize Puppeteer browser.");
        }
        return this.browser;
    }

    async onModuleInit() {
        await this.initBrowser()
    }

    async getBrowser() {
        return await this.ensureBrowserInitialized()
    }

    async getNewContext() {
        return (await this.getBrowser()).createBrowserContext();
    }

    async deleteContext(context: puppeteer.BrowserContext) {
        await context.close()
    }

    async deleteBrowser() {
        if(this.browser) {
            await this.browser.close();
            this.logger.log("Browser closed successfully.");
            this.browser = null;
        }
    }
}