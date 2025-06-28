import { Module } from "@nestjs/common";
import { HubModule } from "../hub/hub.module";
import { ReferralService } from "./referral.service";
import { ReferralController } from "./referral.controller";

@Module({
    imports: [HubModule],
    providers: [ReferralService],
    controllers: [ReferralController]
})
export class ReferralModule {}