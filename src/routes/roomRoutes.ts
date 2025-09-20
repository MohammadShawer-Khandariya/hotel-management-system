import { Router } from 'express';
import { RoomController } from '../controllers';
import { validateRoomCreation, validateRoomStatusUpdate } from '../middleware/validation';
import { asyncHandler } from '../middleware/asyncHandler';

const router: Router = Router();
const roomController = new RoomController();

// POST /api/rooms - Create a new room
router.post(
  '/',
  validateRoomCreation,
  asyncHandler(roomController.createRoom.bind(roomController))
);

// GET /api/rooms - Get all rooms with filtering and pagination
router.get(
  '/',
  asyncHandler(roomController.getRooms.bind(roomController))
);

// GET /api/rooms/available - Get available rooms
router.get(
  '/available',
  asyncHandler(roomController.getAvailableRooms.bind(roomController))
);

// GET /api/rooms/:id - Get room by ID
router.get(
  '/:id',
  asyncHandler(roomController.getRoomById.bind(roomController))
);

// PATCH /api/rooms/:id/status - Update room status
router.patch(
  '/:id/status',
  validateRoomStatusUpdate,
  asyncHandler(roomController.updateRoomStatus.bind(roomController))
);

export default router;
