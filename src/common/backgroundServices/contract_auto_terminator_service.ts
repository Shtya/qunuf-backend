

import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ContractsService } from "src/modules/contracts/contracts.service";

@Injectable()
export class ContractAutoTerminatorService {
    private readonly logger = new Logger(ContractAutoTerminatorService.name);

    constructor(private readonly contractsService: ContractsService) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async processDailyContractUpdates() {
        this.logger.log('Starting daily contract checks...');

        await this.handlePendingTerminations();

        await this.handleNaturalExpirations();
    }

    private async handlePendingTerminations() {
        try {
            const pendingContracts = await this.contractsService.findPendingTerminationContracts();
            if (pendingContracts.length > 0) {
                this.logger.log(`Found ${pendingContracts.length} pending termination contracts.`);
                for (const contract of pendingContracts) {
                    try {
                        await this.contractsService.autoFinalizeTermination(contract.id);
                        this.logger.log(`Contract ${contract.id} finalized (Early Termination).`);
                    } catch (e) {
                        this.logger.error(`Error finalizing contract ${contract.id}`, e);
                    }
                }
            }
        } catch (e) { this.logger.error('Error in handlePendingTerminations', e); }
    }

    private async handleNaturalExpirations() {
        try {
            const expiredContracts = await this.contractsService.findExpiredActiveContracts();
            if (expiredContracts.length > 0) {
                this.logger.log(`Found ${expiredContracts.length} expired active contracts.`);

                for (const contract of expiredContracts) {
                    try {
                        await this.contractsService.autoExpireAndCreateRenewRequest(contract.id);
                        this.logger.log(`Contract ${contract.id} processed for expiration/renewal.`);
                    } catch (e) {
                        this.logger.error(`Error processing expiration for contract ${contract.id}`, e);
                    }
                }
            }
        } catch (e) { this.logger.error('Error in handleNaturalExpirations', e); }
    }
}