import { Module } from "@nestjs/common";
import { ScarpingModule } from "../scarping/scarping.module";
import { WarehouseModule } from "../warehouse/warehouse.module";
import { TradeService } from "./trade.service";
import { CookiePersistenceModule } from "@backend/cookies";
import { TradeController } from "./trade.controller";
import { ProxyModule } from "../proxies/proxies.module";
@Module({
  imports: [
    ScarpingModule,
    WarehouseModule,
    CookiePersistenceModule,
    ProxyModule
  ],
  providers: [TradeService],
  controllers: [TradeController]
})
export class TradeModule {}