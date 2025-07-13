import { Body, Controller, Delete, Param, Patch, Post, UseFilters, UseGuards } from '@nestjs/common';
import { CreateProxyValidationPipe } from './pipes';
import { ProxiesService } from './proxies.service';
import { CreateProxy, createProxySchema } from './types/CreateProxyType/CreateProxy';
import { AdminCheckGuard, CatchFilter } from '@backend/nestjs';
import { CreateProxyArray, createProxyArraySchema } from './types/CreateManyProxyType/CreateManyProxy';

@UseGuards(AdminCheckGuard)
@UseFilters(CatchFilter)
@Controller('proxies')
export class ProxiesController {
    constructor(private readonly proxiesService: ProxiesService) {}

    @Post('create')
    async createProxy(@Body(new CreateProxyValidationPipe(createProxySchema)) createProxyDto: CreateProxy) {
        return this.proxiesService.createProxy(createProxyDto);
    }

    @Post('create-many')
    async createMany(@Body(new CreateProxyValidationPipe<CreateProxyArray>(createProxyArraySchema)) createManyProxyDto: CreateProxyArray) {
        return this.proxiesService.createMany(createManyProxyDto)
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