import Queue from 'bull';
import { generateDiscrepancyReport } from '../utils/inventoryDiff';
import { InventorySnapshot, Stay } from '../models';
import logger from '../utils/logger';

// Create audit job queue
export const createAuditJobQueue = new Queue('audit processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
});

// Process discrepancy analysis jobs
createAuditJobQueue.process('analyze-discrepancies', async (job) => {
  const { stayId } = job.data;
  
  try {
    logger.info(`Processing discrepancy analysis for stay: ${stayId}`);
    
    // Find check-in and check-out snapshots
    const [checkinSnapshot, checkoutSnapshot] = await Promise.all([
      InventorySnapshot.findOne({ stayId, snapshotType: 'checkin' }),
      InventorySnapshot.findOne({ stayId, snapshotType: 'checkout' })
    ]);
    
    if (!checkinSnapshot || !checkoutSnapshot) {
      throw new Error(`Missing inventory snapshots for stay: ${stayId}`);
    }
    
    // Get stay information
    const stay = await Stay.findById(stayId)
      .populate('guestId', 'firstName lastName')
      .populate('roomId', 'roomNumber');
    
    if (!stay) {
      throw new Error(`Stay not found: ${stayId}`);
    }
    
    // Generate discrepancy report
    const report = await generateDiscrepancyReport(
      checkinSnapshot,
      checkoutSnapshot,
      stay
    );
    
    // Store report or send notification based on severity
    if (report.discrepancies.length > 0) {
      logger.warn(`Discrepancies found for stay ${stayId}:`, {
        totalDiscrepancies: report.totalDiscrepancies,
        estimatedCost: report.estimatedCost,
        highSeverityCount: report.discrepancies.filter(d => d.severity === 'high').length
      });
      
      // Here you could:
      // 1. Store the report in database
      // 2. Send email notifications
      // 3. Create alerts for management
      // 4. Update dashboard metrics
    }
    
    logger.info(`Completed discrepancy analysis for stay: ${stayId}`);
    return report;
    
  } catch (error) {
    logger.error(`Error processing discrepancy analysis for stay ${stayId}:`, error);
    throw error;
  }
});

// Job event handlers
createAuditJobQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed successfully`);
});

createAuditJobQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed:`, err);
});

createAuditJobQueue.on('stalled', (job) => {
  logger.warn(`Job ${job.id} stalled`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await createAuditJobQueue.close();
});

process.on('SIGINT', async () => {
  await createAuditJobQueue.close();
});
