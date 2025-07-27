import * as z from 'zod';


export const createProxySchema = z.object({
  ip: z.string().min(1, 'No ip provided.'),
  port: z.number().min(1, 'No port provided.')
}).passthrough();

export type CreateProxy = z.infer<typeof createProxySchema> & { 
  isActive?: boolean
};