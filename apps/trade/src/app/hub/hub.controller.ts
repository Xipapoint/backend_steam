import { Body, Controller, HttpException, HttpStatus, Logger, Post } from "@nestjs/common"
import { HubService } from "./hub.service";

@Controller('hub')
export class HubController {
    private readonly logger = new Logger(HubController.name)

    constructor(private readonly hubService: HubService) {}

    @Post('create')
    async createHub(
        @Body() body: { faceitId: string; hubName: string; hubImage: string; amountUsers: number },
    ) {
        const { faceitId, hubName, hubImage, amountUsers } = body;

        if (!faceitId || !hubName || !hubImage || typeof amountUsers !== 'number') {
        this.logger.warn(`Invalid request data: ${JSON.stringify(body)}`);
        throw new HttpException('Invalid request data', HttpStatus.BAD_REQUEST);
        }

        const hub = await this.hubService.createHub(faceitId, hubName, hubImage, amountUsers);

        if (!hub) {
        this.logger.debug(`Hub with FaceitId ${faceitId} already exists.`);
        throw new HttpException('Hub already exists', HttpStatus.CONFLICT);
        }

        return { success: true, data: hub };
    }
}