import { Router } from 'express';
import { AuditController, InventoryController } from '../controllers';
import { asyncHandler } from '../middleware/asyncHandler';

const router: Router = Router();
const auditController = new AuditController();
const inventoryController = new InventoryController();

// GET /api/audit/logs - Get audit logs with filtering and pagination
router.get(
  '/logs',
  asyncHandler(auditController.getAuditLogs.bind(auditController))
);

// GET /api/audit/stats - Get audit statistics
router.get(
  '/stats',
  asyncHandler(auditController.getAuditStats.bind(auditController))
);

// GET /api/audit/entity/:entityType/:entityId - Get audit logs for specific entity
router.get(
  '/entity/:entityType/:entityId',
  asyncHandler(auditController.getEntityAuditLogs.bind(auditController))
);

// GET /api/audit/user/:userId - Get user activity logs
router.get(
  '/user/:userId',
  asyncHandler(auditController.getUserActivityLogs.bind(auditController))
);

// GET /api/audit/discrepancies/:stayId - Get discrepancy report for a stay
router.get(
  '/discrepancies/:stayId',
  asyncHandler(inventoryController.getDiscrepancyReport.bind(inventoryController))
);

export default router;
