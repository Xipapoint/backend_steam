import { Module } from "@nestjs/common";
import { ScarpingService } from "./scarping.service";

@Module({
    providers: [ScarpingService],
    exports: [ScarpingService]
})
export class ScarpingModule {}