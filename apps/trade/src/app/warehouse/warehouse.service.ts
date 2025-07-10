import { Repository } from "typeorm";
import { WarehouseAccount } from "@backend/database";
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from "@nestjs/common";
@Injectable()
export class WarehouseService {
    private readonly logger: Logger = new Logger(WarehouseService.name)
    constructor(@InjectRepository(WarehouseAccount) private readonly warehouseAccountRepository: Repository<WarehouseAccount>) {}
    
    async createWarehouseAccount(steamId: string, tradeUserId: string, refferalCode: string) {
        try {
            const existingAccount = await this.warehouseAccountRepository.findOne({where: {steamId}})
            if(existingAccount) {
                this.logger.log(`Account with steamId: ${steamId} already exists`)
                return false
            }
            await this.warehouseAccountRepository.save({steamId, tradeUserId, refferalCode})
            return true
        } catch (error) {
            this.logger.error("Error while creating warehouse account: ", error)
        }
    }

    async setWarehouseAccountActiveStatus(steamId: string, isActive: boolean) {
        const existingAccount = await this.warehouseAccountRepository.findOne({ where: { steamId } });
        if (!existingAccount) {
            this.logger.log(`Account with steamId: ${steamId} doesn't exist`);
            return false;
        }
    
        existingAccount.isActive = isActive;
        await this.warehouseAccountRepository.save(existingAccount);
        return true;
    }

    async deleteWarehouseAccount(steamId: string) {
        try {
            const result = await this.warehouseAccountRepository.delete({ steamId });
            if (result.affected && result.affected > 0) {
                this.logger.log(`Account with steamId: ${steamId} deleted`);
                return true;
            } else {
                this.logger.log(`Account with steamId: ${steamId} not found`);
                return false;
            }
        } catch (error) {
            this.logger.error("Error while deleting warehouse account: ", error);
            return false;
        }
    }

    async getWarehouseAccountByStatusAndRefferal(status: boolean, refferalCode: string): Promise<WarehouseAccount | null> {
        try {
            const account = await this.warehouseAccountRepository.findOne({
                where: {
                    isActive: status,
                    refferalCode: refferalCode
                }
            });
            return account || null;
        } catch (error) {
            this.logger.error("Error while fetching warehouse account by status and refferal code: ", error);
            return null;
        }
    }
}