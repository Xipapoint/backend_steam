import * as z from 'zod';
import { createProxySchema } from '../CreateProxyType/CreateProxy';

export const createManyProxySchema = z.array(createProxySchema);

export type CreateManyProxy = z.infer<typeof createManyProxySchema>;