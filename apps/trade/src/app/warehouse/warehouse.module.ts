import { Module } from "@nestjs/common";
import { WarehouseController } from "./warehouse.controller";
import { WarehouseService } from "./warehouse.service";
import { WarehouseAccount } from "./entities/WarehouseAccount";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CookiePersistenceModule } from "@backend/cookies";

@Module({
    imports: [
        TypeOrmModule.forFeature([WarehouseAccount]),
        CookiePersistenceModule, 
    ],
    controllers: [WarehouseController],
    providers: [WarehouseService],
    exports: [WarehouseService]
})
export class WarehouseModule {}