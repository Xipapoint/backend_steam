import * as puppeteer from 'puppeteer';
import { PuppeteerService } from '../../puppeteer/puppeteer.service';
import { TASK_NAMES } from '../../shared/enums';
import { LoginRequest } from '../../shared/dto/BaseLoginRequest';
import { Injectable } from '@nestjs/common';

export interface LoginOptions {
    closePage?: boolean
}

interface ExecuteParams<T, K> {
    controllerCallback: (page: puppeteer.Page, parsedBody: T, options?: LoginOptions) => Promise<K>,
    parsedBody: T,
    taskName: TASK_NAMES,
    loadCookiesFn?: (page: puppeteer.Page, username: string) => Promise<void>,
    saveCookiesFn?: (page: puppeteer.Page, username: string) => Promise<void>,
    options?: LoginOptions
}


@Injectable()
export class AbstractLogin {
    constructor(private readonly puppeteerService: PuppeteerService){}

    async execute<T extends LoginRequest, K>(
        {
            controllerCallback,
            parsedBody,
            taskName,
            loadCookiesFn,
            saveCookiesFn,
            options
        }: ExecuteParams<T, K>
    ) {
        if(options && options.closePage)
            await this.puppeteerService.deleteContext(parsedBody.username);

        const taskFn = (page: puppeteer.Page): Promise<K> =>
            controllerCallback(page, parsedBody, options);

        return await this.puppeteerService.executePuppeteerTask(
            parsedBody.username,
            taskName,
            taskFn,
            loadCookiesFn, 
            saveCookiesFn,
            options?.closePage,
        );
        
    }
}