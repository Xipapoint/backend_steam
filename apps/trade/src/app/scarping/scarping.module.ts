import { Module } from "@nestjs/common";
import { ScarpingService } from "./scarping.service";
import { CookiePersistenceModule } from "@backend/cookies";
import { HttpModule } from "../http/http.module";

@Module({
    imports: [
        CookiePersistenceModule, 
        HttpModule
    ],
    providers: [ScarpingService],
    exports: [ScarpingService]
})
export class ScarpingModule {}