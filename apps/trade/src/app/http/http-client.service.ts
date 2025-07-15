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

  private getRandomUserAgent(): string {
    const userAgents = [
        // Windows Chrome
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.187 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.5790.170 Safari/537.36',
        // Windows Firefox
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:116.0) Gecko/20100101 Firefox/116.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:115.0) Gecko/20100101 Firefox/115.0',
        // MacOS Safari
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_6_8) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
        // MacOS Chrome
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
        // Linux Chrome
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.187 Safari/537.36',
        // Linux Firefox
        'Mozilla/5.0 (X11; Linux x86_64; rv:116.0) Gecko/20100101 Firefox/116.0',
        // Android Chrome
        'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.187 Mobile Safari/537.36',
        // iOS Safari
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}


  async createHttpProxyClient(username: string) {
    const proxy = await this.proxyService.getRandomProxy();
    if (!proxy) throw new NotFound("Proxy doesn't exist");
    this.logger.log(`Proxy ip: ${proxy.ip}`)
    const proxyAuth = `jjoster301:VoqYwnQiWv@`;
    const proxyUrl = `http://${proxyAuth}${proxy.ip}:${proxy.port}`;
    const agent = new HttpsProxyAgent(proxyUrl);
    const jar = new CookieJar();
    await this.cookiePersistence.loadToJar(username, jar);

    const cookies = await jar.getCookieString("https://steamcommunity.com")
    const filteredCookies = cookies.replace(/steamLoginSecure=[^;]+;?\s*/g, '')
    this.logger.log(cookies)
    const httpClient = axios.create({
      httpAgent: agent,
      httpsAgent: agent,
      headers: {
        Cookie: filteredCookies,
        'User-Agent': this.getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
      },
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
