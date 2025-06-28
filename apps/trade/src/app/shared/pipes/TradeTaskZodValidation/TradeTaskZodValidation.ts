import { TradeTaskRequest } from "@backend/communication";
import { ZodValidationPipe } from "@backend/nestjs";
import { Injectable } from "@nestjs/common";
import { ZodSchema } from "zod";

@Injectable()
export class TradeTaskZodValidation<T extends TradeTaskRequest> extends ZodValidationPipe<T> {
    constructor(protected override schema: ZodSchema<T>) {
        super(schema);
    }
}