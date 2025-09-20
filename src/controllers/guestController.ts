import { Request, Response } from 'express';
import { Guest, Stay, Room, AuditLog, InventorySnapshot } from '../models';
import { RoomStatus } from '../types';
import { redisClient } from '../config/redis';
import { createAuditJobQueue } from '../jobs/auditQueue';
import logger from '../utils/logger';

export class GuestController {
  // Create a new guest
  async createGuest(req: Request, res: Response): Promise<void> {
    try {
      const guestData = req.body;
      
      // Check if guest already exists by email or ID number
      const existingGuest = await Guest.findOne({
        $or: [
          { email: guestData.email },
          { idNumber: guestData.idNumber }
        ]
      });

      if (existingGuest) {
        res.status(400).json({
          success: false,
          message: 'Guest already exists with this email or ID number'
        });
        return;
      }

      const guest = new Guest(guestData);
      await guest.save();

      res.status(201).json({
        success: true,
        data: guest
      });
    } catch (error) {
      logger.error('Error creating guest:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Check-in guest
  async checkIn(req: Request, res: Response): Promise<void> {
    try {
      const {
        guestId,
        roomId,
        checkInDate = new Date(),
        plannedCheckOutDate,
        notes,
        inventorySnapshot
      } = req.body;

      // Validate guest exists
      const guest = await Guest.findById(guestId);
      if (!guest) {
        res.status(404).json({
          success: false,
          message: 'Guest not found'
        });
        return;
      }

      // Validate room exists and is available
      const room = await Room.findById(roomId);
      if (!room) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        });
        return;
      }

      if (room.status !== RoomStatus.AVAILABLE) {
        res.status(400).json({
          success: false,
          message: 'Room is not available'
        });
        return;
      }

      // Check for conflicting active stays
      const conflictingStay = await Stay.findOne({
        roomId,
        status: 'active'
      });

      if (conflictingStay) {
        res.status(400).json({
          success: false,
          message: 'Room is already occupied'
        });
        return;
      }

      // Create stay record
      const stay = new Stay({
        guestId,
        roomId,
        checkInDate: new Date(checkInDate),
        plannedCheckOutDate: new Date(plannedCheckOutDate),
        notes,
        status: 'active'
      });

      await stay.save();

      // Update room status to occupied
      room.status = RoomStatus.OCCUPIED;
      await room.save();

      // Update Redis cache
      await redisClient.setEx(
        `room:${room.roomNumber}:status`,
        3600,
        RoomStatus.OCCUPIED
      );

      // Create inventory snapshot if provided
      if (inventorySnapshot && inventorySnapshot.items) {
        const snapshot = new InventorySnapshot({
          roomId,
          stayId: stay._id.toString(),
          snapshotType: 'checkin',
          items: inventorySnapshot.items,
          takenBy: inventorySnapshot.takenBy || 'system',
          notes: inventorySnapshot.notes
        });
        await snapshot.save();
      }

      // Create audit log
      await AuditLog.create({
        action: 'checkin',
        entityType: 'stay',
        entityId: stay._id.toString(),
        userId: req.body.userId || 'system',
        details: {
          guestId,
          roomId,
          roomNumber: room.roomNumber,
          guestName: `${guest.firstName} ${guest.lastName}`,
          checkInDate,
          plannedCheckOutDate
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Populate guest and room details for response
      const populatedStay = await Stay.findById(stay._id)
        .populate('guestId', 'firstName lastName email')
        .populate('roomId', 'roomNumber type');

      res.status(201).json({
        success: true,
        data: populatedStay
      });
    } catch (error) {
      logger.error('Error during check-in:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Check-out guest
  async checkOut(req: Request, res: Response): Promise<void> {
    try {
      const {
        stayId,
        checkOutDate = new Date(),
        inventorySnapshot,
        totalAmount
      } = req.body;

      // Find the active stay
      const stay = await Stay.findOne({
        _id: stayId,
        status: 'active'
      }).populate('guestId roomId');

      if (!stay) {
        res.status(404).json({
          success: false,
          message: 'Active stay not found'
        });
        return;
      }

      // Update stay record
      stay.checkOutDate = new Date(checkOutDate);
      stay.status = 'completed';
      if (totalAmount) stay.totalAmount = totalAmount;
      await stay.save();

      // Update room status to available
      const room = await Room.findById(stay.roomId);
      if (room) {
        room.status = RoomStatus.AVAILABLE;
        await room.save();

        // Update Redis cache
        await redisClient.setEx(
          `room:${room.roomNumber}:status`,
          3600,
          RoomStatus.AVAILABLE
        );
      }

      // Create checkout inventory snapshot if provided
      if (inventorySnapshot && inventorySnapshot.items) {
        const snapshot = new InventorySnapshot({
          roomId: stay.roomId.toString(),
          stayId: stay._id.toString(),
          snapshotType: 'checkout',
          items: inventorySnapshot.items,
          takenBy: inventorySnapshot.takenBy || 'system',
          notes: inventorySnapshot.notes
        });
        await snapshot.save();

        // Queue discrepancy analysis job
        await createAuditJobQueue.add('analyze-discrepancies', {
          stayId: stay._id.toString()
        });
      }

      // Create audit log
      await AuditLog.create({
        action: 'checkout',
        entityType: 'stay',
        entityId: stay._id.toString(),
        userId: req.body.userId || 'system',
        details: {
          guestId: stay.guestId,
          roomId: stay.roomId,
          roomNumber: room?.roomNumber,
          checkOutDate,
          totalAmount,
          stayDuration: stay.duration
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: stay
      });
    } catch (error) {
      logger.error('Error during check-out:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get guest by ID
  async getGuestById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const guest = await Guest.findById(id);

      if (!guest) {
        res.status(404).json({
          success: false,
          message: 'Guest not found'
        });
        return;
      }

      res.json({
        success: true,
        data: guest
      });
    } catch (error) {
      logger.error('Error fetching guest:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get guest stay history
  async getGuestStayHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const stays = await Stay.find({ guestId: id })
        .populate('roomId', 'roomNumber type')
        .sort({ checkInDate: -1 });

      res.json({
        success: true,
        data: stays
      });
    } catch (error) {
      logger.error('Error fetching guest stay history:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all guests with pagination
  async getGuests(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'lastName',
        sortOrder = 'asc'
      } = req.query;

      const filter: any = {};
      
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const sortOptions: any = {};
      sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [guests, total] = await Promise.all([
        Guest.find(filter)
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit as string)),
        Guest.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          guests,
          pagination: {
            currentPage: parseInt(page as string),
            totalPages: Math.ceil(total / parseInt(limit as string)),
            totalItems: total,
            itemsPerPage: parseInt(limit as string)
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching guests:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
