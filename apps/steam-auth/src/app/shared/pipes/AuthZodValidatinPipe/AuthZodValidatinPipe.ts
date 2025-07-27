import { ZodValidationPipe } from "@backend/nestjs";
import { Injectable } from "@nestjs/common";
import { LoginRequest } from "../../dto/BaseLoginRequest";
import { ZodSchema } from "zod";

@Injectable()
export class AuthZodValidationPipe<T extends LoginRequest> extends ZodValidationPipe<T> {
    constructor(protected override schema: ZodSchema<T>) {
        super(schema);
    }
}