import { CommunicationModule } from "@backend/communication";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AbstractLogin } from "./abstract/abstract.login";
import { SteamAuthController } from "./auth.controller";
import { SteamAuthService } from "./auth.service";
import {CookiePersistenceModule} from '@backend/cookies'
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities";
import { PuppeteerModule } from "../puppeteer/puppeteer.module";
import { LoginEventService } from './login-event/LoginEventService';

@Module({
    imports: [ 
        PuppeteerModule,
        CookiePersistenceModule, 
        CommunicationModule, 
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forFeature([User])
    ],
    providers: [
        SteamAuthService,
        AbstractLogin,
        LoginEventService
    ],
    controllers: [SteamAuthController],
})
export class AuthModule {}