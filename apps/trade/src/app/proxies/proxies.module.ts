import { Module } from "@nestjs/common";
import { ProxiesService } from "./proxies.service";
import { ProxiesController } from "./proxies.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Proxy } from "../shared/entities";

@Module({
    imports: [
        TypeOrmModule.forFeature([Proxy]),
    ],
    providers: [ProxiesService],
    controllers: [ProxiesController],
    exports: [ProxiesService]
})
export class ProxyModule {

}