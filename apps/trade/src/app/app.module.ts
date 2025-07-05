import { Module } from '@nestjs/common';
import { TradeModule } from './trade/trade.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { ScarpingModule } from './scarping/scarping.module';
import { ReferralModule } from './refferal/referral.module';
import { HubModule } from './hub/hub.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from '@backend/database';
import { DataSourceOptions } from 'typeorm';

@Module({
  imports: [
    TradeModule, 
    WarehouseModule, 
    ScarpingModule, 
    ReferralModule, 
    HubModule, 
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): DataSourceOptions => getTypeOrmConfig(__dirname),
    }),
  ],
})
export class AppModule {}
