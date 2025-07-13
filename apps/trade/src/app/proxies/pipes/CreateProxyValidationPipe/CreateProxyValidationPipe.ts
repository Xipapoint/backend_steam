import { ZodValidationPipe } from "@backend/nestjs";
import { Injectable } from "@nestjs/common";
import { ZodSchema } from "zod";
import { CreateProxy } from '../../types';

@Injectable()
export class CreateProxyValidationPipe<T extends CreateProxy | CreateProxy[]> extends ZodValidationPipe<T> {
    constructor(protected override schema: ZodSchema<T>) {
        super(schema);
    }
}