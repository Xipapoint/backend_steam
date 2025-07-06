import { Module } from "@nestjs/common";
import { ScarpingService } from "./scarping.service";
import { CookiePersistenceModule } from "@backend/cookies";

@Module({
    imports: [
        CookiePersistenceModule, 
    ],
    providers: [ScarpingService],
    exports: [ScarpingService]
})
export class ScarpingModule {}