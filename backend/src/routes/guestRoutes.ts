import { Router } from 'express';
import { GuestController } from '../controllers';
import { validateGuestCreation, validateCheckIn, validateCheckOut } from '../middleware/validation';
import { asyncHandler } from '../middleware/asyncHandler';

const router: Router = Router();
const guestController = new GuestController();

// POST /api/guests - Create a new guest
router.post(
  '/',
  validateGuestCreation,
  asyncHandler(guestController.createGuest.bind(guestController))
);

// GET /api/guests - Get all guests with pagination
router.get(
  '/',
  asyncHandler(guestController.getGuests.bind(guestController))
);

// GET /api/guests/:id - Get guest by ID
router.get(
  '/:id',
  asyncHandler(guestController.getGuestById.bind(guestController))
);

// GET /api/guests/:id/stays - Get guest stay history
router.get(
  '/:id/stays',
  asyncHandler(guestController.getGuestStayHistory.bind(guestController))
);

// POST /api/guests/checkin - Check-in guest
router.post(
  '/checkin',
  validateCheckIn,
  asyncHandler(guestController.checkIn.bind(guestController))
);

// POST /api/guests/checkout - Check-out guest
router.post(
  '/checkout',
  validateCheckOut,
  asyncHandler(guestController.checkOut.bind(guestController))
);

export default router;
