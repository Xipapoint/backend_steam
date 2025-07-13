import { z } from "zod";
import { CreateProxy, createProxySchema } from "../CreateProxyType/CreateProxy";

export const createProxyArraySchema = z.array(createProxySchema);

export type CreateProxyArray = Array<CreateProxy>;
