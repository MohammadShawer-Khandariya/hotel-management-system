import { Request, Response } from 'express';
import { Room, AuditLog } from '../models';
import { RoomStatus, RoomType } from '../types';
import { redisClient } from '../config/redis';
import logger from '../utils/logger';

export class RoomController {
  // Create a new room
  async createRoom(req: Request, res: Response): Promise<void> {
    try {
      const roomData = req.body;
      
      // Check if room number already exists
      const existingRoom = await Room.findOne({ roomNumber: roomData.roomNumber });
      if (existingRoom) {
        res.status(400).json({
          success: false,
          message: 'Room number already exists'
        });
        return;
      }

      const room = new Room(roomData);
      await room.save();

      // Cache the room status
      await redisClient.setEx(
        `room:${room.roomNumber}:status`,
        3600, // 1 hour TTL
        room.status
      );

      // Log the action
      await AuditLog.create({
        action: 'room_status_change',
        entityType: 'room',
        entityId: room._id.toString(),
        userId: req.body.userId || 'system',
        details: {
          action: 'created',
          roomNumber: room.roomNumber,
          status: room.status
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        data: room
      });
    } catch (error) {
      logger.error('Error creating room:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all rooms with filtering and pagination
  async getRooms(req: Request, res: Response): Promise<void> {
    try {
      const {
        status,
        type,
        floor,
        page = 1,
        limit = 10,
        sortBy = 'roomNumber',
        sortOrder = 'asc'
      } = req.query;

      const filter: any = {};
      if (status) filter.status = status;
      if (type) filter.type = type;
      if (floor) filter.floor = parseInt(floor as string);

      const sortOptions: any = {};
      sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [rooms, total] = await Promise.all([
        Room.find(filter)
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit as string)),
        Room.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          rooms,
          pagination: {
            currentPage: parseInt(page as string),
            totalPages: Math.ceil(total / parseInt(limit as string)),
            totalItems: total,
            itemsPerPage: parseInt(limit as string)
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching rooms:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get room by ID
  async getRoomById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const room = await Room.findById(id);

      if (!room) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        });
        return;
      }

      res.json({
        success: true,
        data: room
      });
    } catch (error) {
      logger.error('Error fetching room:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update room status
  async updateRoomStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!Object.values(RoomStatus).includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid room status'
        });
        return;
      }

      const room = await Room.findById(id);
      if (!room) {
        res.status(404).json({
          success: false,
          message: 'Room not found'
        });
        return;
      }

      const oldStatus = room.status;
      room.status = status;
      await room.save();

      // Update cache
      await redisClient.setEx(
        `room:${room.roomNumber}:status`,
        3600,
        status
      );

      // Log the action
      await AuditLog.create({
        action: 'room_status_change',
        entityType: 'room',
        entityId: room._id.toString(),
        userId: req.body.userId || 'system',
        details: {
          action: 'status_updated',
          roomNumber: room.roomNumber,
          oldStatus,
          newStatus: status
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: room
      });
    } catch (error) {
      logger.error('Error updating room status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get available rooms
  async getAvailableRooms(req: Request, res: Response): Promise<void> {
    try {
      const { type, floor, checkIn, checkOut } = req.query;

      const filter: any = { status: RoomStatus.AVAILABLE };
      if (type) filter.type = type;
      if (floor) filter.floor = parseInt(floor as string);

      // If dates are provided, check for conflicts with existing stays
      let roomIds: string[] = [];
      if (checkIn && checkOut) {
        const { Stay } = await import('../models');
        const conflictingStays = await Stay.find({
          status: 'active',
          $or: [
            {
              checkInDate: { $lte: new Date(checkOut as string) },
              plannedCheckOutDate: { $gte: new Date(checkIn as string) }
            }
          ]
        }).select('roomId');

        const conflictingRoomIds = conflictingStays.map(stay => stay.roomId);
        filter._id = { $nin: conflictingRoomIds };
      }

      const rooms = await Room.find(filter).sort('roomNumber');

      res.json({
        success: true,
        data: rooms
      });
    } catch (error) {
      logger.error('Error fetching available rooms:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
