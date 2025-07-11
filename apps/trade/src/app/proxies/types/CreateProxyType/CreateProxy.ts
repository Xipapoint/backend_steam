import * as z from 'zod';


export const createProxySchema = z.object({
    ip: z.number().min(1, 'No ip provided.'),
    port: z.number().min(1, 'No port provided.')
}).strict();

export type CreateProxy = z.infer<typeof createProxySchema> & { 
    isActive?: boolean 
};

const invalidProxy: CreateProxy = {
  port: 8080
};