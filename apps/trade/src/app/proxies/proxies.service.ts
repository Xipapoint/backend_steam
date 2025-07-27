import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { Proxy } from "../shared";
import { CreateProxyArray } from "./types/CreateManyProxyType/CreateManyProxy";
import { CreateProxy } from './types/CreateProxyType/CreateProxy';

@Injectable()
export class ProxiesService {
    constructor(
        @InjectRepository(Proxy)
        private readonly proxyRepository: Repository<Proxy>,
    ) {}

    async createProxy(data: CreateProxy): Promise<Proxy> {
        return await this.proxyRepository.save(data);
    }

    async createMany(data: CreateProxyArray): Promise<Proxy[]> {
        return await this.proxyRepository.save(data);
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

    async getRandomProxy(): Promise<Proxy | null> {
        const proxies = await this.proxyRepository.find({ where: { isActive: true, cooldown: IsNull(), isUsing: false } });
        await this.proxyRepository
            .createQueryBuilder('proxy')
            .update(Proxy)
            .set({isUsing: false})
            .set({cooldown: new Date(Date.now() + 20 * 60 * 1000)})
            .where("isUsing = :isUsing", { isUsing: true })
            .execute()
        if (proxies.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * proxies.length);
        const selectedProxy = proxies[randomIndex];
        selectedProxy.isUsing = true
        await this.proxyRepository.save(selectedProxy)
        return selectedProxy
    }
}