import { Module } from "@nestjs/common";
import { HubModule } from "../hub/hub.module";
import { ReferralService } from "./referral.service";
import { ReferralController } from "./referral.controller";
import { RefferalLink } from "@backend/database";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [
        HubModule,
        TypeOrmModule.forFeature([RefferalLink])
    ],
    providers: [ReferralService],
    controllers: [ReferralController]
})
export class ReferralModule {}