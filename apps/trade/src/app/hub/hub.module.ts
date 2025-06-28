import { Module } from "@nestjs/common";
import { HubService } from "./hub.service";

@Module({
    imports: [],
    providers: [HubService],
    exports: [HubService],
})
export class HubModule {}