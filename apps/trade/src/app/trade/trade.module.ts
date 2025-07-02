import { Module } from "@nestjs/common";
import { ScarpingModule } from "../scarping/scarping.module";
import { WarehouseModule } from "../warehouse/warehouse.module";
import { TradeService } from "./trade.service";
@Module({
  imports: [
    ScarpingModule,
    WarehouseModule,
  ],
  providers: [TradeService]
})
export class TradeModule {}