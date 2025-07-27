import { z } from "zod";

export const baseLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  inviteCode: z.string().min(1),
});

export type LoginRequest = z.infer<typeof baseLoginSchema>;