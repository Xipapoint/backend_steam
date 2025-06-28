import { TradeTaskRequest } from '@backend/communication';
import { AdminCheckGuard, CatchFilter } from '@backend/nestjs';
import { Body, Controller, Post, UseFilters, UseGuards } from "@nestjs/common";
import { TradeTaskZodValidation } from '../shared';
import * as z from 'zod';
import { TradeService } from './trade.service';


const tradeTaskSchema = z.object({
    jar: z.object({}),
    httpClient: z.object({}),
    username: z.string().min(1, 'No username provided.'),
    inviteCode: z.string().min(1, 'No invite code provided.')
}).strict() as unknown as z.ZodType<TradeTaskRequest, z.ZodTypeDef, TradeTaskRequest>;


@Controller('trade')
@UseGuards(AdminCheckGuard)
export class TradeController {

    constructor(private readonly tradeService: TradeService) {}
    @UseFilters(CatchFilter)
    @Post('start-monitoring')
    async startMonitoring(@Body(new TradeTaskZodValidation(tradeTaskSchema)) data: TradeTaskRequest) {
        this.tradeService.monitorTradesWithCheerio(data.httpClient, data.jar, data.username, data.inviteCode);
    }
} 