import { COOKIE_PERSISTENCE_SERVICE } from "@backend/communication";
import { Module } from "@nestjs/common";
import { FileCookiePersistenceService } from "./CookiesPersistance.service";

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