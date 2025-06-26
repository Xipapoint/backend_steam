import { AxiosInstance } from 'axios';
import { NextFunction, Request, Response } from 'express';
import { CookieJar } from 'tough-cookie';
import SteamAuthService from './steam-auth.service';
import { z, ZodType, ZodTypeDef } from 'zod';
import { Body, Controller, Inject, Injectable, Logger, Post, Res } from '@nestjs/common';
import { AbstractLogin } from './abstract/abstract.login';
import { LoginRequest } from '../shared/dto/login/LoginRequestDTO';
import { AuthZodValidationPipe, ZodValidationPipe } from '@backend/nestjs';
import { LoginSteamGuardRequest } from '../shared/dto/login-steamguard/LoginSteamGuardRequest';
import { LoginResult } from '../shared/dto/login-result/LoginResult';
import { LoginAcceptionRequest } from '../shared/dto/login-acception/LoginAcceptionRequest';
import { COMMUNICATION_PROVIDER_TOKEN, CommunicationProvider } from '@backend/communication';
import { AuthUtils } from '../puppeteer/utils';

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
}).strict() as ZodType<LoginSteamGuardRequest, ZodTypeDef, LoginSteamGuardRequest>; ;

const loginSchema = z
  .object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    inviteCode: z.string().min(1, "Invite code is required"),
  })
.strict() as ZodType<LoginRequest, ZodTypeDef, LoginRequest>;

type HttpTaskFunction<T> = (
    httpClient: AxiosInstance,
    cookieJar: CookieJar,
    username: string
) => Promise<T>;


@Controller('auth')
@Injectable()
export class SteamAuthController {
    private readonly logger: Logger = new Logger(SteamAuthController.name);

    constructor(
        private readonly steamAuthService: SteamAuthService, 
        private readonly abstractLogin: AbstractLogin,
        private readonly authUtils: AuthUtils,
        @Inject(COMMUNICATION_PROVIDER_TOKEN) private readonly communicationProvider: CommunicationProvider,
    ) {}

    
    @Post('login')
    async login(
        @Body(new AuthZodValidationPipe(loginSchema)) parsedData: LoginRequest,
        @Res() res: Response,
        next: NextFunction
    ) {
        try {
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
        } catch (error: any) {
            next(error)
        }
    }

    @Post('login-acception')
    public async loginWithAcception(
        @Body(new ZodValidationPipe(loginWithSteamGuardCodeSchema)) parsedData: LoginSteamGuardRequest,
        @Res() res: Response,
        next: NextFunction
    ) {
        try {
            const success = await this.abstractLogin.execute<LoginAcceptionRequest, LoginResult>(
                {
                    controllerCallback: this.steamAuthService.login.bind(this.steamAuthService),
                    parsedBody: parsedData,
                    taskName: TASK_NAMES.loginWithAcception,
                    loadCookiesFn: this.authUtils.loadCookiesFromFile.bind(this),
                    saveCookiesFn: this.authUtils.saveCookiesToFile.bind(this),
                }
            )
            res.send({success})
            if(success) {
                const tradeTaskFn = (httpClient: AxiosInstance, cookieJar: CookieJar): Promise<void> => {
                    return this.steamAuthService.monitorTradesWithCheerio(httpClient, cookieJar, username, inviteCode);
                };
                this.executeHttpTask(
                    username,
                    "monitorTrades",
                    tradeTaskFn
                )
            }
        } catch (error) {
            next(error)
        }
    }

    
    @Post('login-with-code')
    public async loginWithSteamGuardCode(
        @Body(new AuthZodValidationPipe(loginSchema)) parsedData: LoginSteamGuardRequest,
        @Res() res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const success = await this.abstractLogin.execute<LoginSteamGuardRequest, LoginResult>(
                {
                    controllerCallback: this.steamAuthService.login.bind(this.steamAuthService),
                    parsedBody: parsedData,
                    taskName: TASK_NAMES.typeSteamGuardCode,
                    saveCookiesFn: this.authUtils.saveCookiesToFile.bind(this),
                    options: { closePage: parsedData.closePage }
                }
            )
            if(success) {
                this.logger.log(`[User: ${parsedData.username}] Login successful. Triggering background trade monitoring.`);
                const tradeTaskFn = (httpClient: AxiosInstance, cookieJar: CookieJar): Promise<void> => {
                    return this.steamAuthService.monitorTradesWithCheerio(httpClient, cookieJar, username, inviteCode);
                };
    
                this.executeHttpTask(
                    username, 
                    'monitorTrades', 
                    tradeTaskFn
                );
            }

            res.send({ success });
            return;
        } catch (error: any) {
            next(error)
        }
    }

    @Post('login-cookies')
    public async loginUserWithCookies(
        req: Request<object, object, { username: string, inviteCode: string }>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        const { username, inviteCode } = req.body;
        if(!inviteCode || inviteCode.length === 0)
            res.status(400).send({ success: false, message: "No invite codes provided." });
        try {
            this.executeHttpTask(
                username, 
                'monitorTrades', 
                this.steamAuthService.monitorTradesWithCheerio.bind(this.steamAuthService), 
                this.authUtils.loadCookiesFromFile.bind(this), 
                this.authUtils.saveCookiesToFile.bind(this)
            );
            res.send({ success: true });
        } catch (error: any) {
            next(error)
        }
    }
}

