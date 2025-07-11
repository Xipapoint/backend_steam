import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Proxy } from '@backend/database';
import { CreateProxy } from './types/CreateProxyType/CreateProxy';

@Injectable()
export class ProxiesService {
    constructor(
        @InjectRepository(Proxy)
        private readonly proxyRepository: Repository<Proxy>,
    ) {}

    async createProxy(data: CreateProxy): Promise<Proxy> {
        const proxy = this.proxyRepository.create(data);
        return this.proxyRepository.save(proxy);
    }

    async deleteProxy(id: number): Promise<Proxy> {
        const proxy = await this.proxyRepository.findOneByOrFail({ id });
        await this.proxyRepository.remove(proxy);
        return proxy;
    }

    async setActiveProxy(id: number): Promise<Proxy> {
        await this.proxyRepository.update(id, { isActive: true });
        return this.proxyRepository.findOneByOrFail({ id });
    }

    async setDisabledProxy(id: number) {
        await this.proxyRepository.update(id, { isActive: false });
        return this.proxyRepository.findOneByOrFail({ id });
    }
}