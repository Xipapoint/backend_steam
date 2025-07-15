import { AdminCheckGuard, CatchFilter } from '@backend/nestjs';
import { Controller, Post, UseFilters, UseGuards } from "@nestjs/common";
import { TradeService } from './trade.service';

@Controller('trade')
@UseGuards(AdminCheckGuard)
export class TradeController {

    constructor(private readonly tradeService: TradeService) {}
    
    @UseFilters(CatchFilter)
    @Post('monitor-trades')
    async startMonitoring() {
        await this.tradeService.monitorTradesLifecycle();
    }
} 