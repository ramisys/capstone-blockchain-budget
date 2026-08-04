import { blockchainProvider } from '../config/blockchain.js';
import { blockchainRepository } from '../repositories/blockchainRepository.js';
import { blockchainService } from './blockchainService.js';
import { logger } from '../utils/logger.js';

const SYSTEM_ACTOR = {
  id: 'system-scheduler',
  email: 'system-scheduler@university.edu',
  role: 'System',
};

export class BlockchainScheduler {
  constructor() {
    this.timer = null;
    this.isProcessing = false;
  }

  /**
   * Scan for and retry unconfirmed (Pending / Failed) blockchain records if the
   * blockchain provider is configured.
   *
   * Safeguarded against concurrent overlapping runs. Individual record failures
   * are caught so batch reconciliation continues fail-soft.
   *
   * @returns {Promise<{processed: number, succeeded: number, failed: number}>} Summary of results
   */
  async reconcilePendingRecords() {
    if (!blockchainProvider.isConfigured()) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    if (this.isProcessing) {
      logger.logEvent('Blockchain scheduler reconciliation skipped: previous run still in progress.');
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isProcessing = true;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      const unconfirmed = await blockchainRepository.findUnconfirmed();
      processed = unconfirmed.length;

      if (processed > 0) {
        logger.logEvent(`Blockchain scheduler starting reconciliation for ${processed} unconfirmed record(s)...`);

        for (const record of unconfirmed) {
          try {
            await blockchainService.retryRecord(record.allocationId, SYSTEM_ACTOR);
            succeeded++;
          } catch (error) {
            failed++;
            logger.logEvent(
              `Blockchain scheduler auto-retry failed for allocation ${record.allocationCode}: ${
                error?.message || String(error)
              }`
            );
          }
        }

        logger.logEvent(
          `Blockchain scheduler finished reconciliation pass: ${succeeded} succeeded, ${failed} failed.`
        );
      }
    } catch (error) {
      logger.logEvent(
        `Blockchain scheduler batch fetch failed: ${error?.message || String(error)}`
      );
    } finally {
      this.isProcessing = false;
    }

    return { processed, succeeded, failed };
  }

  /**
   * Start periodic background reconciliation.
   *
   * @param {number} [intervalMs=60000] - Reconciliation interval in milliseconds
   */
  start(intervalMs = 60000) {
    if (this.timer) {
      return;
    }

    logger.logEvent(`Blockchain scheduler started with ${intervalMs}ms interval.`);

    this.timer = setInterval(() => {
      this.reconcilePendingRecords().catch((error) => {
        logger.logEvent(`Unhandled error in blockchain scheduler interval: ${error?.message || error}`);
      });
    }, intervalMs);
  }

  /**
   * Stop periodic background reconciliation.
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.logEvent('Blockchain scheduler stopped.');
    }
  }
}

export const blockchainScheduler = new BlockchainScheduler();
