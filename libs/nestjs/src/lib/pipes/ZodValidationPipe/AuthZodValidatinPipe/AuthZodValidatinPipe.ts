import { Injectable } from "@nestjs/common";
import { BaseLoginRequest } from "../../../shared/dto";
import { ZodValidationPipe } from "../ZodValidationPipe";
import { ZodSchema } from "zod";

@Injectable()
export class AuthZodValidationPipe<T extends BaseLoginRequest> extends ZodValidationPipe<T> {
    constructor(protected override schema: ZodSchema<T>) {
        super(schema);
    }
}