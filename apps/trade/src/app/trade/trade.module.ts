import { Module } from "@nestjs/common";
import { ScarpingModule } from "../scarping/scarping.module";
import { WarehouseModule } from "../warehouse/warehouse.module";
import { TradeService } from "./trade.service";
import { CookiePersistenceModule } from "@backend/cookies";
@Module({
  imports: [
    ScarpingModule,
    WarehouseModule,
    CookiePersistenceModule, 
  ],
  providers: [TradeService]
})
export class TradeModule {}