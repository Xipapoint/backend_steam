import { COMMUNICATION_PROVIDER_TOKEN, CommunicationProvider } from '@backend/communication';
import { COOKIE_PERSISTENCE_SERVICE, CookiePersistenceService } from '@backend/cookies';
import { CatchFilter, ZodValidationPipe } from '@backend/nestjs';
import { Body, Controller, Inject, Injectable, Post, Res, UseFilters } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { z, ZodType, ZodTypeDef } from 'zod';
import { LoginAcceptionRequest } from '../shared/dto/login-acception/LoginAcceptionRequest';
import { LoginResult } from '../shared/dto/login-result/LoginResult';
import { LoginSteamGuardRequest } from '../shared/dto/login-steamguard/LoginSteamGuardRequest';
import { LoginRequest } from '../shared/dto/login/LoginRequestDTO';
import { AuthZodValidationPipe } from '../shared/pipes';
import { AbstractLogin } from './abstract/abstract.login';
import { SteamAuthService } from './auth.service';

enum TASK_NAMES {
    login = "login",
    loginWithAcception = 'loginWithAcception',
    loginWithCookies = "loginWithCookies",
    typeSteamGuardCode = 'typeSteamGuardCode',
    monitorTrades = "monitorTrades"
}

const loginWithSteamGuardCodeSchema = z.object({
  steamGuardCode: z.string().min(1, 'No steam guard code provided.'),
  username: z.string().min(1, 'No username provided.'),
  password: z.string().min(1, 'No password provided.'),
  inviteCode: z.string().min(1, 'No invite codes provided.'),
  closePage: z.boolean(),
}).strict() as ZodType<LoginSteamGuardRequest, ZodTypeDef, LoginSteamGuardRequest>;

const loginSchema = z
  .object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    inviteCode: z.string().min(1, "Invite code is required"),
  })
.strict() as ZodType<LoginRequest, ZodTypeDef, LoginRequest>;

@Controller('auth')
@Injectable()
export class SteamAuthController {

    constructor(
        private readonly steamAuthService: SteamAuthService, 
        private readonly abstractLogin: AbstractLogin,
        @Inject(COOKIE_PERSISTENCE_SERVICE)
        private readonly cookiePersistence: CookiePersistenceService,
        @Inject(COMMUNICATION_PROVIDER_TOKEN)
        private readonly httpCommunicationProvider: CommunicationProvider,
        private readonly configService: ConfigService
    ) {}

    
    @Post('login')
    @UseFilters(CatchFilter)
    async login(
        @Body(new AuthZodValidationPipe(loginSchema)) parsedData: LoginRequest,
        @Res() res: Response,
    ) {
        console.log(parsedData);
        
            const success = await this.abstractLogin.execute<LoginRequest, LoginResult>(
                {
                    controllerCallback: this.steamAuthService.login.bind(this.steamAuthService),
                    parsedBody: parsedData,
                    taskName: TASK_NAMES.login,
                    options: { closePage: true }
                }
            )
            if(typeof success === 'boolean') 
                res.send({success}) 
            else
                res.send(success)
    }

    @Post('login-acception')
    @UseFilters(CatchFilter)
    public async loginWithAcception(
        @Body(new ZodValidationPipe(loginSchema)) parsedData: LoginRequest,
        @Res() res: Response,
    ) {
        console.log(parsedData);
        
            const success = await this.abstractLogin.execute<LoginRequest, LoginResult>(
                {
                    controllerCallback: this.steamAuthService.loginWithAcception.bind(this.steamAuthService),
                    parsedBody: parsedData,
                    taskName: TASK_NAMES.loginWithAcception,
                    loadCookiesFn: this.cookiePersistence.loadCookiesFromFile.bind(this),
                    saveCookiesFn: this.cookiePersistence.saveCookiesToFile.bind(this),
                }
            )
            res.send({success})
            if(success) {
                this.httpCommunicationProvider.sendWithState({
                    baseUrl: this.configService.getOrThrow<string>('TRADE_SERVICE_URL'),
                    path: '/trade/monitor-trades',
                    username: parsedData.username,
                    inviteCode: parsedData.inviteCode,
                })
            }
    }

    
    @Post('login-with-code')
    @UseFilters(CatchFilter)
    public async loginWithSteamGuardCode(
        @Body(new AuthZodValidationPipe(loginWithSteamGuardCodeSchema)) parsedData: LoginSteamGuardRequest,
        @Res() res: Response,
    ): Promise<void> {
            const success = await this.abstractLogin.execute<LoginSteamGuardRequest, LoginResult>(
                {
                    controllerCallback: this.steamAuthService.login.bind(this.steamAuthService),
                    parsedBody: parsedData,
                    taskName: TASK_NAMES.typeSteamGuardCode,
                    saveCookiesFn: this.cookiePersistence.saveCookiesToFile.bind(this),
                    options: { closePage: parsedData.closePage }
                }
            )
            if(success) {
                this.httpCommunicationProvider.sendWithState({
                    baseUrl: this.configService.getOrThrow<string>('TRADE_SERVICE_URL'),
                    path: '/trade/monitor-trades',
                    username: parsedData.username,
                    inviteCode: parsedData.inviteCode,
                })
            }

            res.send({ success });
            return;
    }

    @Post('login-cookies')
    @UseFilters(CatchFilter)
    public async loginUserWithCookies(
        @Body(new AuthZodValidationPipe(loginSchema)) parsedData: LoginSteamGuardRequest,
        res: Response,
    ): Promise<void> {
            this.httpCommunicationProvider.sendWithState({
                baseUrl: this.configService.getOrThrow<string>('TRADE_SERVICE_URL'),
                path: '/trade/monitor-trades',
                username: parsedData.username,
                inviteCode: parsedData.inviteCode,
            })
            res.send({ success: true });
    }
}

