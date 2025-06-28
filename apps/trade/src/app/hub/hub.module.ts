import { Module } from "@nestjs/common";
import { HubService } from "./hub.service";
import { HubController } from "./hub.controller";

@Module({
    imports: [],
    providers: [HubService],
    exports: [HubService],
    controllers: [HubController]
})
export class HubModule {}