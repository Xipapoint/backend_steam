import { CookieJar } from 'tough-cookie';
import * as puppeteer from 'puppeteer';
export interface CookiePersistenceService {
    /**
     * Загружает cookie по ключу (например, username) и помещает их в предоставленный jar.
     * @param key Уникальный ключ для сессии (e.g., username).
     * @param jar Экземпляр CookieJar, в который нужно загрузить cookie.
     */
    load(key: string, jar: CookieJar): Promise<void>;

    /**
     * Сохраняет cookie из предоставленного jar по ключу.
     * @param key Уникальный ключ для сессии (e.g., username).
     * @param jar Экземпляр CookieJar, из которого нужно сохранить cookie.
     */
    save(key: string, jar: CookieJar): Promise<void>;

    saveCookiesToFile(username: string, cookies: puppeteer.Cookie[]): Promise<void>

    loadCookiesFromFile(username: string): Promise<puppeteer.Cookie[]>
  
}