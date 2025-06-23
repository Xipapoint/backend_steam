import { Body, Controller, Injectable, Logger, Next, Post, Res, UseGuards } from "@nestjs/common";
import { NextFunction, Response } from 'express';
import { PuppeteerService } from "./puppeteer.service";
import { AdminCheckGuard } from "@backend/nestjs";

@Controller('puppeteer')
@UseGuards(AdminCheckGuard)
@Injectable()
export class PuppeteerController {
    constructor(
        private readonly puppeteerService: PuppeteerService,
        private readonly logger: Logger
    ) {}

    @Post('/close-page-by-user')
    public async closePage(
        @Body() body: { username: string },
        @Res() res: Response,
        @Next() next: NextFunction
    ): Promise<void> {
    const { username } = body;
    try {
      await this.puppeteerService.deleteContext(username);
      res.status(200).send({ success: true, message: `Page for user ${username} closed.` });
    } catch (error) {
      this.logger.error(`Error closing page for user ${username}:`, error);
      next(error);
    }
    }

    @Post('/delete-cookies')
    public async deleteCookies(
        @Body() body: { username: string },
        @Res() res: Response,
        @Next() next: NextFunction
    ): Promise<void> {
        const { username } = body;
        try {
            const result = await this.puppeteerService.deleteCookies(username);
            if (result) {
                res.status(200).send({ success: result, message: `Cookies for user ${username} deleted.` });
            } else {
                res.status(400).send({ success: result, message: `No cookies file found for user ${username}.` });
            }
        } catch (error) {
            this.logger.error(`Error deleting cookies for user ${username}:`, error);
            next(error)
        }
    }
}