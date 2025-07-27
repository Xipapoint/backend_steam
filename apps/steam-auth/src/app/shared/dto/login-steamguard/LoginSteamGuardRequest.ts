import { z } from 'zod';
import { baseLoginSchema } from '../BaseLoginRequest';
export const steamGuardSchema = baseLoginSchema.extend({
  steamGuardCode: z.string().min(1),
  closePage: z.boolean().default(true),
});

export type LoginWithCodeRequest = z.infer<typeof steamGuardSchema>;