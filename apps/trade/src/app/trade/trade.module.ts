import { Module } from "@nestjs/common";
import { ScarpingModule } from "../scarping/scarping.module";
import { WarehouseModule } from "../warehouse/warehouse.module";
import { TradeService } from "./trade.service";
import { CookiePersistenceModule } from "@backend/cookies";
import { TradeController } from "./trade.controller";
import { ProxyModule } from "../proxies/proxies.module";
import { ClsModule } from "nestjs-cls";
import { HttpModule } from "../http/http.module";
@Module({
  imports: [
    ScarpingModule,
    WarehouseModule,
    CookiePersistenceModule,
    ProxyModule,
    ClsModule.forRoot({
      middleware: {
        mount: true,
        setup: (cls, req) => {
          cls.set('username', req.headers['x-username'])
          cls.set('inviteCode', req.headers['x-invite-code'])
        },
      },
    }),
    HttpModule,
  ],
  providers: [TradeService],
  controllers: [TradeController]
})
export class TradeModule {}