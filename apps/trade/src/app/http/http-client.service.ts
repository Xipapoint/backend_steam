import { COOKIE_PERSISTENCE_SERVICE, CookiePersistenceService } from "@backend/cookies";
import { NotFound } from "@backend/nestjs";
import { Inject, Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { HttpsProxyAgent } from "https-proxy-agent";
import { CookieJar, Cookie } from 'tough-cookie';
import { ProxiesService } from "../proxies/proxies.service";

@Injectable()
export class HttpClientService {
    private readonly logger = new Logger(HttpClientService.name)
  constructor(
    @Inject(COOKIE_PERSISTENCE_SERVICE)
    private readonly cookiePersistence: CookiePersistenceService,
    private readonly proxyService: ProxiesService,
  ) {}

  async createHttpProxyClient(username: string) {
    const proxy = await this.proxyService.getRandomProxy();
    if (!proxy) throw new NotFound("Proxy doesn't exist");
    this.logger.log(`Proxy ip: ${proxy.ip}`)
    const proxyAuth = `jjoster301:VoqYwnQiWv@`;
    const proxyUrl = `http://${proxyAuth}${proxy.ip}:${proxy.port}`;
    const agent = new HttpsProxyAgent(proxyUrl);
    const jar = new CookieJar();
    // await this.cookiePersistence.loadToJar(username, jar);

    const cookies = await jar.getCookieString("https://steamcommunity.com")
    const httpClient = axios.create({
      httpAgent: agent,
      httpsAgent: agent,
      headers: {
        Cookie: cookies
      }
    });
    return { httpClient, jar };
  }

  async createHttpClient(username: string) {
    const jar = new CookieJar();
    await this.cookiePersistence.loadToJar(username, jar);
    const httpClient = wrapper(axios.create({ jar }));
    return { httpClient, jar };
  }
}
