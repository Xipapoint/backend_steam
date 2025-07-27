import { COOKIE_PERSISTENCE_SERVICE, CookiePersistenceService } from '@backend/cookies';
import { CatchFilter } from '@backend/nestjs';
import { Body, Controller, Inject, Post, Res, UseFilters } from '@nestjs/common';
import { Response } from 'express';
import { baseLoginSchema, LoginRequest } from '../shared/dto/BaseLoginRequest';
import { LoginWithCodeRequest, steamGuardSchema } from '../shared/dto/login-steamguard/LoginSteamGuardRequest';
import { AuthZodValidationPipe } from '../shared/pipes';
import { AbstractLogin } from './abstract/abstract.login';
import { SteamAuthService } from './auth.service';
import { LoginEventService } from '../login-event/LoginEventService';
import * as puppeteer from 'puppeteer';
import { LoginResult } from '../shared/dto/login-result/LoginResult';

enum TASK_NAMES {
  login = 'login',
  loginWithAcception = 'loginWithAcception',
  loginWithCookies = 'loginWithCookies',
  typeSteamGuardCode = 'typeSteamGuardCode',
}

@Controller('auth')
export class SteamAuthController {
  constructor(
    private readonly steamAuthService: SteamAuthService,
    private readonly abstractLogin: AbstractLogin,
    private readonly loginEventService: LoginEventService,
    @Inject(COOKIE_PERSISTENCE_SERVICE)
    private readonly cookiePersistence: CookiePersistenceService
  ) {}

  private async doLogin<T extends LoginRequest>(
    dto: T,
    taskName: TASK_NAMES,
    controllerCallback: (page: puppeteer.Page, body: T, options?) => Promise<any>,
    saveCookies: boolean,
    options?: { closePage?: boolean },
  ) {
    const result = await this.abstractLogin.execute<T, LoginResult>(
      {
        controllerCallback,
        parsedBody: dto,
        taskName,
        loadCookiesFn: saveCookies ? this.cookiePersistence.loadCookies.bind(this.cookiePersistence) : undefined,
        saveCookiesFn: saveCookies ? this.cookiePersistence.saveCookies.bind(this.cookiePersistence) : undefined,
        options,
      }
    );
    if (result) {
      this.loginEventService.publishLoginEvent((dto).username, (dto).inviteCode);
    }
    return result;
  }

  @Post('login')
  @UseFilters(CatchFilter)
  async login(
    @Body(new AuthZodValidationPipe(baseLoginSchema)) dto: LoginRequest,
    @Res() res: Response
  ) {
    const success = await this.doLogin(
      dto,
      TASK_NAMES.login,
      this.steamAuthService.login.bind(this.steamAuthService),
      false,
      { closePage: true },
    );
    return res.send({ success });
  }

  @Post('login-acception')
  @UseFilters(CatchFilter)
  async loginWithAcception(
    @Body(new AuthZodValidationPipe(baseLoginSchema)) dto: LoginRequest,
    @Res() res: Response
  ) {
    const success = await this.doLogin(
      dto,
      TASK_NAMES.loginWithAcception,
      this.steamAuthService.loginWithAcception.bind(this.steamAuthService),
      true
    );
    return res.send({ success });
  }

  @Post('login-with-code')
  @UseFilters(CatchFilter)
  async loginWithSteamGuardCode(
    @Body(new AuthZodValidationPipe(steamGuardSchema)) dto: LoginWithCodeRequest,
    @Res() res: Response
  ) {
    const success = await this.doLogin(
      dto,
      TASK_NAMES.typeSteamGuardCode,
      this.steamAuthService.login.bind(this.steamAuthService),
      true,
      { closePage: dto.closePage },
    );
    return res.send({ success });
  }

  @Post('login-cookies')
  @UseFilters(CatchFilter)
  async loginWithCookies(
    @Body(new AuthZodValidationPipe(baseLoginSchema)) dto: LoginRequest,
    @Res() res: Response
  ) {
    this.loginEventService.publishLoginEvent(dto.username, dto.inviteCode);
    return res.send({ success: true });
  }
}