import { COOKIE_PERSISTENCE_SERVICE } from "./consts/cookie-persistance-token";
import { Module } from "@nestjs/common";
import { FileCookiePersistenceService } from "./cookies-persistance.service";
import { S3ClientModule } from "../aws/s3.module";

@Module({
  imports: [
    S3ClientModule.forRoot(),
  ],
  providers: [
    {
      provide: COOKIE_PERSISTENCE_SERVICE,
      useClass: FileCookiePersistenceService,
    },
  ],
  exports: [COOKIE_PERSISTENCE_SERVICE],
})
export class CookiePersistenceModule {}