import { Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradeService } from "./trade.service";
import { ScarpingModule } from "../scarping/scarping.module";
import { WarehouseModule } from "../warehouse/warehouse.module";
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    }),
    ScarpingModule,
    WarehouseModule,
  ],
  providers: [TradeService]
})
export class TradeModule {}
