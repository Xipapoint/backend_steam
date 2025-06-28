import { Controller, Logger, Post, Body, HttpException, HttpStatus, Delete, Param, Patch, UseGuards } from "@nestjs/common";
import { WarehouseService } from "./warehouse.service";
import { CreateWarehouseAccount, SetActiveStatus } from "./dto";
import { AdminCheckGuard } from "@backend/nestjs";

@Controller('warehouse')
@UseGuards(AdminCheckGuard)
export class WarehouseController {
  private readonly logger = new Logger(WarehouseController.name);

  constructor(
    private readonly warehouseService: WarehouseService,
  ) {}

  @Post('account')
  async createWarehouseAccount(@Body() dto: CreateWarehouseAccount) {
    const { steamId, tradeUserId, refferalCode } = dto;

    try {
      const result = await this.warehouseService.createWarehouseAccount(steamId, tradeUserId, refferalCode);
      return { success: result };
    } catch (error) {
      this.logger.error('Error while creating warehouse account', error);
      throw new HttpException('Failed to create warehouse account', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('account/delete/:steamId')
  async deleteWarehouseAccount(@Param('steamId') steamId: string) {
    try {
      const result = await this.warehouseService.deleteWarehouseAccount(steamId);
      return { success: result };
    } catch (error) {
      this.logger.error(`Error while deleting warehouse account with steamId: ${steamId}`, error);
      throw new HttpException('Failed to delete warehouse account', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch('account/:steamId/status')
  async setActiveStatusWarehouseAccount(
    @Param('steamId') steamId: string,
    @Body() { isActive }: SetActiveStatus,
  ) {
    try {
      const result = await this.warehouseService.setWarehouseAccountActiveStatus(steamId, isActive);
      return { success: result };
    } catch (error) {
      this.logger.error(`Error while setting active status for warehouse account with steamId: ${steamId}`, error);
      throw new HttpException('Failed to update active status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}