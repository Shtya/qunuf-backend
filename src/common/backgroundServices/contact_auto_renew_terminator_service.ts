// common/backgroundServices/contract_auto_updater_service.ts

import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ContractsService } from "src/modules/contracts/contracts.service";

@Injectable()
export class ContractAutoRenewTerminatorService {
    private readonly logger = new Logger(ContractAutoRenewTerminatorService.name);

    constructor(private readonly contractsService: ContractsService) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleDailyMaintenance() {
        this.logger.log('Starting daily maintenance tasks...');

        await this.handleExpiredRenewOffers();
    }

    private async handleExpiredRenewOffers() {
        try {
            this.logger.log('Checking for expired renewal offers...');
            const count = await this.contractsService.processExpiredRenewRequests();
            if (count) {
                this.logger.log(`Successfully expired ${count} renewal requests.`);
            }
        } catch (err) {
            this.logger.error('Failed to process expired renew requests', err.stack);
        }
    }

}