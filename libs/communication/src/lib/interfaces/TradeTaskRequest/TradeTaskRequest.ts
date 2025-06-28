import { AxiosInstance } from "axios";
import { CookieJar } from "tough-cookie";
import * as z from 'zod';


export const tradeTaskSchema = z.object({
    jar: z.object({}),
    httpClient: z.object({}),
    username: z.string().min(1, 'No username provided.'),
    inviteCode: z.string().min(1, 'No invite code provided.')
}).strict()

export type TradeMonitoringTaskDto = z.infer<typeof tradeTaskSchema>;
