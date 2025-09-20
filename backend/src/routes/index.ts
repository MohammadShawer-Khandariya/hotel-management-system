import { Router } from 'express';
import roomRoutes from './roomRoutes';
import guestRoutes from './guestRoutes';
import inventoryRoutes from './inventoryRoutes';
import auditRoutes from './auditRoutes';

const router: Router = Router();

// API Routes
router.use('/rooms', roomRoutes);
router.use('/guests', guestRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/audit', auditRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Hotel Management System API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
