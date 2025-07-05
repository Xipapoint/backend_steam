import { Module } from "@nestjs/common";
import { WarehouseController } from "./warehouse.controller";
import { WarehouseService } from "./warehouse.service";
import { WarehouseAccount } from "./entities/WarehouseAccount";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [
        TypeOrmModule.forFeature([WarehouseAccount])
    ],
    controllers: [WarehouseController],
    providers: [WarehouseService],
    exports: [WarehouseService]
})
export class WarehouseModule {}