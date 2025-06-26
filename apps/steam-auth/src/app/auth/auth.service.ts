import * as puppeteer from 'puppeteer';
import { Repository } from 'typeorm';
import { CustomPromiseTimeout } from '../libs/utils';
import { User } from './entities/User';

import { AppDataSource } from '../dataSource';
import { logger } from '../libs/Logger';
import { WarehouseAccount } from './entities/WarehouseAccount';
import { RequestTimeout } from '../libs/errors/4xx/Request_Timeout_408';

interface InventoryItem {
  appid: number;
  contextid: string;
  amount: string;
  assetid: string;
  classid: string;
  instanceid: string;
}


interface InventoryItemForTrade {
  appid: number;
  contextid: string;
  amount: number;
  assetid: string;
  classid: string;
  instanceid: string;
}

const URLS = {
  steamLogin: 'https://steamcommunity.com/login/home/?goto=',
  steamCommunityBase: 'https://steamcommunity.com', // Полезно для будущих навигаций
  steamSentTradeOffers: 'https://steamcommunity.com/my/tradeoffers/sent',
  // Пример: если URL для трейда строится динамически, лучше так:
  // getTradeOfferUrl: (partnerId: string | number, token: string) =>
  //    `https://steamcommunity.com/tradeoffer/new/?partner=${partnerId}&token=${token}`
  // Но если партнер всегда один, можно оставить как есть:
  steamNewTradeOfferBase: 'https://steamcommunity.com/tradeoffer/new/', // Базовый URL
  specificTradePartnerOffer: 'https://steamcommunity.com/tradeoffer/new/?partner=1072573912&token=Aj76M0yX' // Конкретный партнер
};

const SELECTORS = {
  // Login Page
  loginUsernameInput: 'input[type="text"]._2GBWeup5cttgbTw8FM3tfx', // Важно: Этот селектор очень хрупкий!
  loginPasswordInput: 'input[type="password"]',
  loginSubmitButton: 'button[type="submit"]',
  loginErrorMessage: '._1W_6HXiG4JJ0By1qN_0fGZ', // Важно: Этот селектор очень хрупкий!

  // Steam Guard Page
  steamGuardCodeInput: '[class*="_3xcXqLVteTNHmk-gh9W65d"][class*="Focusable"][maxLength="1"]', // Попытка сделать чуть менее хрупким, но все равно рискованно

  // Trade Offer Page
  inventoryAppSelectorActive: '#appselect_activeapp',
  inventoryAppSelectorCSGO: '#appselect_option_you_730_0', // 730 - ID CS:GO/CS2
  inventoryItemHolder: '.itemHolder', // Родитель предмета
  inventoryItemCSGO: '.item.app730.context2', // Сам предмет (Хрупкий!)
  inventoryItemDraggable: '.itemHolder > .item.app730.context2', // Полный селектор для drag (Хрупкий!)
  tradePartnerSlots: '#their_slots', // Слоты партнера (если нужно)
  tradeYourSlots: '#your_slots', // Ваши слоты (цель для перетаскивания) (Хрупкий!)
  tradeNextPageButton: '#pagebtn_next',
  tradePreviousPageButton: '#pagebtn_back', // На всякий случай
  tradeReadyCheckbox: '#you_notready', // Чекбокс "Готов к обмену" (ID выглядит подозрительно, проверить!)
  tradeSendOfferButton: '.btn_green_steamui.btn_medium', // Кнопка "Предложить обмен" (Слишком общая!)
  tradeConfirmContentsButton: '#trade_confirmbtn', // Кнопка подтверждения содержимого обмена (Хороший селектор - ID)
  tradeAcceptModalButton: '.btn_green_steamui.btn_medium', // Кнопка в модальном окне подтверждения (Слишком общая!)
  tradeCancelModalButton: '.btn_grey_steamui.btn_medium', // Кнопка отмены в модальном окне (Слишком общая!)
  tradeOfferSentConfirmationModal: '.newmodal_content', // Общий селектор модального окна после отправки
  tradeOfferSentConfirmationCloseButton: '.btn_grey_steamui.btn_medium', // Кнопка закрытия модалки (Слишком общая!)

  // Sent Trade Offers Page
  sentTradeOfferItem: '.tradeoffer', // Элемент отправленного обмена
  sentTradeOfferDeclineButton: '.tradeoffer_footer_actions > .btn_grey_steamui.btn_small_thin', // Кнопка "Отменить обмен" (Более специфичный, но проверить!)
  sentTradeOfferDeclineConfirmButton: '.btn_green_steamui.btn_medium' // Кнопка подтверждения отмены (Слишком общая!)
};

const TIMEOUTS = {
  navigation: 60000,       // 60 секунд для навигации
  longNavigation: 120000,  // 2 минуты для ожидания после логина/стимгарда
  selector: 15000,       // 15 секунд для ожидания селектора
  steamGuardPoll: 3000,    // 3 секунды интервал опроса БД для кода
  mouseAction: 100,        // Паузы для действий мышью
  dragDropPause: 200,      // Пауза после перетаскивания
  tradeMonitorInterval: 7000,// 7 секунд интервал проверки трейдов
};

const CONSTANTS = {
  maxSteamGuardPollTries: 120, // Макс. попыток получить код из БД
  // 15 дней в секундах: 15 * 24 * 60 * 60 = 1296000
  tradeMonitorDurationSeconds: 1296000, // Общая длительность мониторинга
  dragDropSteps: 10,         // Шаги для page.mouse.move
  rateLimitBaseWaitSeconds: 10, // Базовое время ожидания при 429
  rateLimitMaxRetries: 5, 
};

class SteamAuthService {

  constructor(
    private readonly userRepository: Repository<User>,
    private readonly warehouseAccountRepository: Repository<WarehouseAccount>,
  ) {}

  private async pageNavigation(page: puppeteer.Page, timeout?: number) {
    return await page.waitForNavigation({ waitUntil: 'networkidle0', timeout });
  }

  private async navToSteamCommunity(
    page: puppeteer.Page, 
    username: string
  ){
      await this._executePuppeteerActionWithPause(
        () => page.goto(URLS.steamLogin),
        page,
        `LoginNav_${username}`
    );
    }

    private async checkForErrorLogin(page: puppeteer.Page): Promise<boolean> {
      try {
        const errorElement = await page.waitForSelector('input[class="_2GBWeup5cttgbTw8FM3tfx _16BUa8w2l6LPH1otvXnwAR"]', {timeout: 2000})
        return !!errorElement
      } catch (e) {
        logger.error(e)
        return false;
      }
    }

  private async baseLogin(
    page: puppeteer.Page,
    username: string,
    password: string,
  ) {
    await this.navToSteamCommunity(page, username);
    await page.waitForSelector('input[class="_2GBWeup5cttgbTw8FM3tfx"]', { timeout: TIMEOUTS.selector });
    await page.type('input[type="text"]', username);

    await page.waitForSelector('input[type="password"]', { timeout: TIMEOUTS.selector });
    await page.type('input[type="password"]', password);

    await page.waitForSelector('button[type="submit"]', { timeout: TIMEOUTS.selector });
    await this._executePuppeteerActionWithPause(
      () => page.click('button[type="submit"]'),
      page,
      `LoginNav_${username}`
    );
    const isErrorOccured = await this.checkForErrorLogin(page);
    if (isErrorOccured) {
      logger.error(`Wrong steam credentials for user ${username}`);
      return false
    }
    return true
  }

  private async checkSelector(page: puppeteer.Page, selector: string, description: string): Promise<boolean> {
    try {
      const found = await page.waitForSelector(selector, { timeout: TIMEOUTS.selector });
      return !!found;
    } catch (e) {
      logger.error(`Selector "${description}" not found:`, e);
      return false;
    }
  }
  
  private async detectSteamGuardState(page: puppeteer.Page): Promise<"SGInput" | "SGAcception" | "NoSGAcception" | "NoSGInput" | "None"> {
    try {
      return await Promise.any([
        this.isSteamGuardSelectorExists(page),
        this.isSteamGuardAcception(page),
        new Promise<"None">((_, reject) =>
          setTimeout(() => reject(new RequestTimeout("Timeout while detecting Steam Guard state")), TIMEOUTS.longNavigation)
        )
      ]);
    } catch (e) {
      logger.error(e);
      throw new e
    }
  }
  
  private async isSteamGuardSelectorExists(page: puppeteer.Page): Promise<"SGInput" | "NoSGInput"> {
    const exists = await this.checkSelector(page, 'input[maxLength="1"]', 'SteamGuard Input');
    return exists ? "SGInput" : "NoSGInput";
  }
  
  private async isSteamGuardAcception(page: puppeteer.Page): Promise<"SGAcception" | "NoSGAcception"> {
    const exists = await this.checkSelector(page, 'div[class="_3zQ9hnkyXJEv7nN0oBU56M"]', 'SteamGuard Acception');
    return exists ? "SGAcception" : "NoSGAcception";
  }

  public async login(
    page: puppeteer.Page,
    username: string,
    password: string,
  ){
    await this.baseLogin(page, username, password);
    const isErrorOccured = await this.checkForErrorLogin(page);
    if (isErrorOccured) {
      logger.error(`Wrong steam credentials for user ${username}`);
      return false
    }
    const guardState = await this.detectSteamGuardState(page);
    logger.debug(`Guard state обнаружен: ${guardState}`)
    if (guardState === "SGInput") {
      return {success: true, guardState}
    }
    return true

  }

  public async loginWithAcception(
    page: puppeteer.Page,
    username: string,
    password: string
  ) {
    try {
      await this.pageNavigation(page, TIMEOUTS.longNavigation).catch(() => {
        throw new RequestTimeout(`Timeout: Main page navigation failed. User: ${username}`)
      })
      await this.userRepository.save({ username, password });
      logger.log(`User ${username} logged in successfully`);
      return true;
    } catch (error) {
      logger.error(error);
      throw error
    }
  }

  private async _executePuppeteerActionWithPause<T>(
    action: () => Promise<T>,
    page: puppeteer.Page,
    actionName: string,
    order = 1
  ): Promise<T | void> {
      let isRateLimited = false;
      const waitSeconds = 60 * 10 / order;
      const rateLimitUrl: string | null = null;
      try {
        logger.debug(`[${actionName}] Attempting action...`)
        const result = await action()
        const error = await page.$(".neterror")
        if (error) {
          isRateLimited = true;
          throw new Error("ERROR 429");
        }
        logger.debug(`[${actionName}] Action successful.`);
        return result;
      } catch (error: any) {
        if (isRateLimited) {
          logger.warn(`[${actionName}] Action failed likely due to rate limit (429 detected for ${rateLimitUrl}). Waiting ${waitSeconds} seconds. Error: ${error.message}`);
          await CustomPromiseTimeout(waitSeconds * 1000);
          logger.debug(`[${actionName}] Retrying action after rate limit...`);
          return this._executePuppeteerActionWithPause(action, page, actionName, order + 1);
        }
         else {
          logger.error(`[${actionName}] Action failed with non-429 error: ${error.message}`);
          throw error;
        }
      }
  }

  private async typeSteamGuardCode(page: puppeteer.Page, code: string) {
    const inputs = await page.$$('[class="_3xcXqLVteTNHmk-gh9W65d Focusable"]');

    for (let i = 0; i < code.length; i++) {
      await inputs[i].type(code[i]);
    }
  }

  public async loginWithSteamGuardCode(
    page: puppeteer.Page,
    steamGuardCode: string,
    username: string,
    password: string,
    closePage: boolean
  ): Promise<boolean> {
      const result = closePage ? await this.login(page, username, password) : null
      if(result) {
        await page.click("div[class='_1K431RbY14lkaFW6-XgSsC _2FyQDUS2uHbW1fzoFK2jLx']")
      }
      await this.typeSteamGuardCode(page, steamGuardCode);
      
      await Promise.race([
        this._executePuppeteerActionWithPause(
          () => this.pageNavigation(page, TIMEOUTS.longNavigation),
          page,
          `MainNav_${username}`
        ),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(`Timeout: Страница не перешла в течение 2 минут. User: ${username}`),
              ),
              TIMEOUTS.longNavigation,
            ),
          ),
        ]);
      await this.userRepository.save({username, password, steamGuardCode})
      return true;
  }

  public async loginUserWithCookies(
    page: puppeteer.Page,
    cookies: puppeteer.Cookie[],
    username: string,
    safeCode: string
  ): Promise<boolean> {
      if (safeCode !== process.env.ADMIN_API_TOKEN) return false
      await this.navToSteamCommunity(page, username);
      await page.setCookie(...cookies);
      return true;
    }
}

export default new SteamAuthService(AppDataSource.getRepository(User), AppDataSource.getRepository(WarehouseAccount));