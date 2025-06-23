import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { ZodSchema } from "zod";
import { BaseLoginRequest } from "../../../../../../apps/steam-auth/src/app/shared/dto/BaseLoginRequest";

@Injectable()
export class ZodValidationPipe<T extends BaseLoginRequest> implements PipeTransform {
  constructor(private schema: ZodSchema<T>) {}

  transform(value: T) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(result.error.issues[0].message);
    }
    return result.data;
  }
}