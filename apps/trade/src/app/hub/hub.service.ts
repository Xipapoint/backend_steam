import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Hub } from "../shared/entities";
import { Repository } from "typeorm";

@Injectable()
export class HubService {
    private readonly logger = new Logger(HubService.name);
    constructor(@InjectRepository(Hub) private readonly hubRepository: Repository<Hub>) {}
        
    public async createHub(faceitId: string, hubName: string, hubImage: string, amountUsers: number) {
        const existingHub = await this.hubRepository.findOne({where: {faceitId}})
        if(existingHub) {
            this.logger.debug(`Hub already exists`);
            return null
        }
        const hub = await this.hubRepository.save({faceitId, hubName, hubImage, amountUsers})
        return hub
    }

    public async getHubByReferralCode(referralCode: string) {
        return this.hubRepository
          .createQueryBuilder('hub')
          .where(':code = ANY(hub.refferalCodes)', { code: referralCode })
          .getOne();
      }
}
