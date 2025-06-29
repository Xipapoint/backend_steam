import { TradeMonitoringTaskDto, tradeTaskSchema } from '@backend/communication';
import { AdminCheckGuard, CatchFilter } from '@backend/nestjs';
import { Body, Controller, Post, UseFilters, UseGuards } from "@nestjs/common";
import { TradeTaskZodValidation } from '../shared';
import { TradeService } from './trade.service';

@Controller('trade')
@UseGuards(AdminCheckGuard)
export class TradeController {

    constructor(private readonly tradeService: TradeService) {}
    @UseFilters(CatchFilter)
    @Post('start-monitoring')
    async startMonitoring(@Body(new TradeTaskZodValidation(tradeTaskSchema)) data: TradeMonitoringTaskDto) {
        this.tradeService.monitorTradesLifecycle(data);
    }
} 