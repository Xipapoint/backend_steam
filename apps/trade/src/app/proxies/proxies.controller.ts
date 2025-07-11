import { Body, Controller, Delete, Param, Patch, Post, UseFilters, UseGuards } from '@nestjs/common';
import { CreateProxyValidationPipe } from './pipes';
import { ProxiesService } from './proxies.service';
import { CreateProxy, createProxySchema } from './types/CreateProxyType/CreateProxy';
import { AdminCheckGuard, CatchFilter } from '@backend/nestjs';

@UseGuards(AdminCheckGuard)
@UseFilters(CatchFilter)
@Controller('proxies')
export class ProxiesController {
    constructor(private readonly proxiesService: ProxiesService) {}

    @Post()
    async createProxy(@Body(new CreateProxyValidationPipe(createProxySchema)) createProxyDto: CreateProxy) {
        return this.proxiesService.createProxy(createProxyDto);
    }

    @Delete(':id')
    async deleteProxy(@Param('id') id: number) {
        return this.proxiesService.deleteProxy(id);
    }

    @Patch(':id/activate')
    async setActiveProxy(@Param('id') id: number) {
        return this.proxiesService.setActiveProxy(id);
    }

    @Patch(':id/disable')
    async setDisabledProxy(@Param('id') id: number) {
        return this.proxiesService.setDisabledProxy(id);
    }
}