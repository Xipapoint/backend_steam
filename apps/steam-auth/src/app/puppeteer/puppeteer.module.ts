import { Module } from "@nestjs/common";
import { PuppeteerClient } from "./puppeteer.client";
import { PuppeteerService } from "./puppeteer.service";
import { PuppeteerController } from "./puppeteer.controller";
import { CookiePersistenceModule } from "@backend/cookies";

@Module({
    providers: [PuppeteerClient, PuppeteerService],
    controllers: [PuppeteerController],
    imports: [CookiePersistenceModule],
    exports: [PuppeteerService]
})
export class PuppeteerModule {}