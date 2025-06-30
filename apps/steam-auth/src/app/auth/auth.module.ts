import { CommunicationModule } from "@backend/communication";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CookiePersistenceModule } from "../cookies-persistance/cookies-persistance.module";
import { AbstractLogin } from "./abstract/abstract.login";
import { SteamAuthController } from "./auth.controller";
import { SteamAuthService } from "./auth.service";

@Module({
    imports: [ 
        CookiePersistenceModule, 
        CommunicationModule, 
        ConfigModule.forRoot({ isGlobal: true }),
    ],
    providers: [
        SteamAuthService,
        AbstractLogin
    ],
    controllers: [SteamAuthController],
})
export class AuthModule {}