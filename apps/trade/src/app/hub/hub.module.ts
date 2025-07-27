import { Module } from "@nestjs/common";
import { HubService } from "./hub.service";
import { HubController } from "./hub.controller";
import { Hub } from "../shared/entities";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [
        TypeOrmModule.forFeature([Hub])
    ],
    providers: [HubService],
    exports: [HubService],
    controllers: [HubController]
})
export class HubModule {}