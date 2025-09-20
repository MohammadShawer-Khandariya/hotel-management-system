import { Router } from 'express';
import { InventoryController } from '../controllers';
import { validateInventorySnapshot } from '../middleware/validation';
import { asyncHandler } from '../middleware/asyncHandler';

const router: Router = Router();
const inventoryController = new InventoryController();

// POST /api/inventory/snapshot - Create inventory snapshot
router.post(
  '/snapshot',
  validateInventorySnapshot,
  asyncHandler(inventoryController.createSnapshot.bind(inventoryController))
);

// GET /api/inventory/snapshots - Get all snapshots with pagination
router.get(
  '/snapshots',
  asyncHandler(inventoryController.getAllSnapshots.bind(inventoryController))
);

// GET /api/inventory/room/:roomId/snapshots - Get snapshots for a room
router.get(
  '/room/:roomId/snapshots',
  asyncHandler(inventoryController.getRoomSnapshots.bind(inventoryController))
);

// GET /api/inventory/stay/:stayId/snapshots - Get snapshots for a stay
router.get(
  '/stay/:stayId/snapshots',
  asyncHandler(inventoryController.getStaySnapshots.bind(inventoryController))
);

export default router;
