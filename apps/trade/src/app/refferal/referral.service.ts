import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RefferalLink } from "./entities/ReferralLink";
import { HubService } from "../hub/hub.service";
import { NotFound } from "@backend/nestjs";
import { boolean } from "zod";

@Injectable()
export class ReferralService {
    private readonly logger = new Logger(ReferralService.name);
    constructor(@InjectRepository(RefferalLink) private readonly refferalRepository: Repository<RefferalLink>, private readonly hubServices: HubService) {}

    private generateRefferalCode():string {
        const chars = 'ABpqCDEFGHjyIklmnorsxJKLMNOtuvwPQRSTUVWXYZabcdefghiz';
        let result = '';
        for (let i = 0; i < 7; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    public async createRefferalByName(name: string, hubFaceitId: string): Promise<string> {
        const code = this.generateRefferalCode();
        const existingRefferal = await this.refferalRepository.exists({ where: { code } })
        if (existingRefferal) {
            this.logger.debug(`Referral code [${code}] already exists. Retrying...`);
            return this.createRefferalByName(name, hubFaceitId);
          } else {
            this.logger.log(`Referral code [${code}] is unique. Creating referral...`);
            try {
              const referralData = { owner: name, code, hubFaceitId };
              const newReferral = this.refferalRepository.create(referralData);
      
              const savedReferral = await this.refferalRepository.save(newReferral);

              this.logger.log(`Referral created with code: ${savedReferral.code}`);
      
              return savedReferral.code;
            } catch (error) {
               this.logger.error(`Failed to save referral with code [${code}]:`, error);
               throw new Error(`Could not create referral after generating unique code ${code}. Database error.`);
            }
          }
    }

    public async getRefferalNameByCode(code: string): Promise<{owner: string, hubFaceitId: string, hubImage: string, hubName: string, amountUsers: number} | null> {
        const refferal = await this.refferalRepository.findOne({ where: { code } });
        if (!refferal) {
            return null;
        }
        const hub = await this.hubServices.getHubByReferralCode(code)
        if(!hub) {
          this.logger.debug(`Hub now found by provided code: ${code}`)
          return null
        }
        return {owner: refferal.owner, hubFaceitId: hub.faceitId, hubImage: hub.hubImage, hubName: hub.hubName, amountUsers: hub.amountUsers};
    }
    
    public async setDefaultValueRefferalCode(refferalCode: string, value: boolean) {
      const refferal = await this.refferalRepository.findOne({where: {code: refferalCode}})
      if(!refferal) {
        throw new NotFound("Couldnt find refferal")
      }
      refferal.isDefault = value
      await this.refferalRepository.save(refferal)
      return true
    }

    public async getDefaultRefferalCode() {
      const refferal = await this.refferalRepository.findOne({ where: {isDefault: true} });
      if(!refferal) {
        throw new NotFound("Couldnt find refferal while fetching default refferal")
      }
      return refferal?.code
    }
}