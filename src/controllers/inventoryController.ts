import { Request, Response } from 'express';
import { InventorySnapshot, Stay, Room, Guest, AuditLog } from '../models';
import { generateDiscrepancyReport } from '../utils/inventoryDiff';
import logger from '../utils/logger';

export class InventoryController {
  // Create inventory snapshot
  async createSnapshot(req: Request, res: Response): Promise<void> {
    try {
      const {
        roomId,
        stayId,
        snapshotType,
        items,
        takenBy,
        notes
      } = req.body;

      // Validate room exists
      const room = await Room.findById(roomId);
      if (!room) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        });
        return;
      }

      // Validate stay exists if provided
      if (stayId) {
        const stay = await Stay.findById(stayId);
        if (!stay) {
          res.status(404).json({
            success: false,
            message: 'Stay not found'
          });
          return;
        }
      }

      const snapshot = new InventorySnapshot({
        roomId,
        stayId,
        snapshotType,
        items,
        takenBy,
        notes
      });

      await snapshot.save();

      // Create audit log
      await AuditLog.create({
        action: 'inventory_snapshot',
        entityType: 'inventory',
        entityId: snapshot._id.toString(),
        userId: req.body.userId || 'system',
        details: {
          roomId,
          roomNumber: room.roomNumber,
          snapshotType,
          itemCount: items.length,
          takenBy
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        data: snapshot
      });
    } catch (error) {
      logger.error('Error creating inventory snapshot:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get inventory snapshots for a room
  async getRoomSnapshots(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const { snapshotType, limit = 10 } = req.query;

      const filter: any = { roomId };
      if (snapshotType) filter.snapshotType = snapshotType;

      const snapshots = await InventorySnapshot.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string))
        .populate('stayId', 'checkInDate checkOutDate');

      res.json({
        success: true,
        data: snapshots
      });
    } catch (error) {
      logger.error('Error fetching room snapshots:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get inventory snapshots for a stay
  async getStaySnapshots(req: Request, res: Response): Promise<void> {
    try {
      const { stayId } = req.params;

      const snapshots = await InventorySnapshot.find({ stayId })
        .sort({ createdAt: 1 })
        .populate('roomId', 'roomNumber type');

      res.json({
        success: true,
        data: snapshots
      });
    } catch (error) {
      logger.error('Error fetching stay snapshots:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get discrepancy report for a stay
  async getDiscrepancyReport(req: Request, res: Response): Promise<void> {
    try {
      const { stayId } = req.params;

      // Find check-in and check-out snapshots
      const [checkinSnapshot, checkoutSnapshot] = await Promise.all([
        InventorySnapshot.findOne({ stayId, snapshotType: 'checkin' }),
        InventorySnapshot.findOne({ stayId, snapshotType: 'checkout' })
      ]);

      if (!checkinSnapshot || !checkoutSnapshot) {
        res.status(404).json({
          success: false,
          message: 'Required inventory snapshots not found'
        });
        return;
      }

      // Get stay and guest information
      const stay = await Stay.findById(stayId)
        .populate('guestId', 'firstName lastName')
        .populate('roomId', 'roomNumber');

      if (!stay) {
        res.status(404).json({
          success: false,
          message: 'Stay not found'
        });
        return;
      }

      // Generate discrepancy report
      const report = await generateDiscrepancyReport(
        checkinSnapshot,
        checkoutSnapshot,
        stay
      );

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Error generating discrepancy report:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all inventory snapshots with pagination
  async getAllSnapshots(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        roomId,
        snapshotType,
        startDate,
        endDate
      } = req.query;

      const filter: any = {};
      if (roomId) filter.roomId = roomId;
      if (snapshotType) filter.snapshotType = snapshotType;
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [snapshots, total] = await Promise.all([
        InventorySnapshot.find(filter)
          .populate('roomId', 'roomNumber type')
          .populate('stayId', 'checkInDate checkOutDate')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit as string)),
        InventorySnapshot.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          snapshots,
          pagination: {
            currentPage: parseInt(page as string),
            totalPages: Math.ceil(total / parseInt(limit as string)),
            totalItems: total,
            itemsPerPage: parseInt(limit as string)
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching inventory snapshots:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
