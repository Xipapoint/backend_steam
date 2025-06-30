import { COOKIE_PERSISTENCE_SERVICE } from "./consts/cookie-persistance-token";
import { Module } from "@nestjs/common";
import { FileCookiePersistenceService } from "./cookies-persistance.service";

@Module({
  providers: [
    {
      provide: COOKIE_PERSISTENCE_SERVICE,
      useClass: FileCookiePersistenceService,
    },
  ],
  exports: [COOKIE_PERSISTENCE_SERVICE],
})
export class CookiePersistenceModule {}