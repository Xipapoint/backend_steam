import { AdminCheckGuard, BadRequest, CatchFilter, NotFound } from "@backend/nestjs";
import { Body, Catch, Controller, Get, Logger, Param, Post, UseGuards } from "@nestjs/common";
import { ReferralService } from "./referral.service";

@Controller('referral')
@UseGuards(AdminCheckGuard)
@Catch(CatchFilter)
export class ReferralController {
  private readonly logger = new Logger(ReferralController.name);

  constructor(private readonly referralService: ReferralService) {}

  @Post('create')
  async createReferralByName(
    @Body('name') name: string,
    @Body('hubFaceitId') hubFaceitId: string
  ): Promise<{ success: boolean; message: string }> {
    if (!name || !name.length) {
      throw new BadRequest('Name is required');
    }
    if (!hubFaceitId || !hubFaceitId.length) {
      throw new BadRequest('Hub id is required');
    }

    const code = await this.referralService.createRefferalByName(name, hubFaceitId);
    return { success: true, message: code };
  }

  @Get('get-referral/:code')
  async getReferralNameByCode(
    @Param('code') code: string
  ): Promise<{ success: boolean; message: string }> {
    if (!code || !code.length) {
      this.logger.error('Code is required');
      throw new BadRequest('Code is required');
    }

    const referralName = await this.referralService.getRefferalNameByCode(code);
    if (!referralName) {
      this.logger.error('Referral not found');
      throw new NotFound('Referral not found');
    }

    return { success: true, message: referralName.owner };
  }

  @Get('get-default')
  async getDefaultReferral(): Promise<{ success: boolean; message: string }> {
    const code = await this.referralService.getDefaultRefferalCode();
    return { success: true, message: code };
  }

  @Post('set-default/:code')
  async setDefault(
    @Param('code') code: string,
    @Body('value') value: boolean
  ): Promise<{ success: boolean; message: string }> {
      if (!code || !code.length) {
        this.logger.error('Code is required');
        throw new BadRequest('Code is required');
      }

      const success = await this.referralService.setDefaultValueRefferalCode(code, value)
      return { success, message: code }
  }
}