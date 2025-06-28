import { Body, Controller, Get, HttpException, HttpStatus, Logger, Param, Post, UseGuards } from "@nestjs/common";
import { ReferralService } from "./referral.service";
import { AdminCheckGuard } from "@backend/nestjs";

@Controller('referral')
@UseGuards(AdminCheckGuard)
export class ReferralController {
  private readonly logger = new Logger(ReferralController.name);

  constructor(private readonly referralService: ReferralService) {}

  @Post('create')
  async createReferralByName(
    @Body('name') name: string,
    @Body('hubFaceitId') hubFaceitId: string
  ): Promise<{ success: boolean; message: string }> {
    if (!name || !name.length) {
      throw new HttpException('Name is required', HttpStatus.BAD_REQUEST);
    }
    if (!hubFaceitId || !hubFaceitId.length) {
      throw new HttpException('Hub id is required', HttpStatus.BAD_REQUEST);
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
      throw new HttpException('Code is required', HttpStatus.BAD_REQUEST);
    }

    const referralName = await this.referralService.getRefferalNameByCode(code);
    if (!referralName) {
      this.logger.error('Referral not found');
      throw new HttpException('Referral not found', HttpStatus.NOT_FOUND);
    }

    return { success: true, message: referralName.owner };
  }

  @Get('get-default')
  async getDefaultReferral(): Promise<{ success: boolean; message: string }> {
    const code = await this.referralService.getDefaultRefferalCode();
    return { success: true, message: code };
  }
}