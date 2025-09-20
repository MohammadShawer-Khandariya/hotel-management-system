import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { RoomType, RoomStatus } from '../types';

// Validation middleware factory
const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.body = value;
    next();
    return;
  };
};

// Room validation schemas
const roomCreationSchema = Joi.object({
  roomNumber: Joi.string().required().trim().min(1).max(10),
  type: Joi.string().valid(...Object.values(RoomType)).required(),
  floor: Joi.number().integer().min(1).required(),
  amenities: Joi.array().items(Joi.string().trim()),
  pricePerNight: Joi.number().min(0).required(),
  maxOccupancy: Joi.number().integer().min(1).required(),
  userId: Joi.string().optional()
});

const roomStatusUpdateSchema = Joi.object({
  status: Joi.string().valid(...Object.values(RoomStatus)).required(),
  userId: Joi.string().optional()
});

// Guest validation schemas
const addressSchema = Joi.object({
  street: Joi.string().required().trim(),
  city: Joi.string().required().trim(),
  state: Joi.string().required().trim(),
  zipCode: Joi.string().required().trim(),
  country: Joi.string().required().trim()
});

const guestCreationSchema = Joi.object({
  firstName: Joi.string().required().trim().min(1).max(50),
  lastName: Joi.string().required().trim().min(1).max(50),
  email: Joi.string().email().required().lowercase().trim(),
  phone: Joi.string().required().trim(),
  idNumber: Joi.string().required().trim(),
  address: addressSchema.required()
});

// Check-in validation schema
const checkInSchema = Joi.object({
  guestId: Joi.string().required(),
  roomId: Joi.string().required(),
  checkInDate: Joi.date().optional(),
  plannedCheckOutDate: Joi.date().required().greater('now'),
  notes: Joi.string().trim().max(1000).optional(),
  inventorySnapshot: Joi.object({
    items: Joi.array().items(Joi.object({
      itemName: Joi.string().required().trim(),
      category: Joi.string().required().trim(),
      quantity: Joi.number().integer().min(0).required(),
      condition: Joi.string().valid('excellent', 'good', 'fair', 'poor', 'missing').required(),
      lastChecked: Joi.date().optional().default(new Date())
    })).optional(),
    takenBy: Joi.string().required().trim(),
    notes: Joi.string().trim().max(500).optional()
  }).optional(),
  userId: Joi.string().optional()
});

// Check-out validation schema
const checkOutSchema = Joi.object({
  stayId: Joi.string().required(),
  checkOutDate: Joi.date().optional(),
  totalAmount: Joi.number().min(0).optional(),
  inventorySnapshot: Joi.object({
    items: Joi.array().items(Joi.object({
      itemName: Joi.string().required().trim(),
      category: Joi.string().required().trim(),
      quantity: Joi.number().integer().min(0).required(),
      condition: Joi.string().valid('excellent', 'good', 'fair', 'poor', 'missing').required(),
      lastChecked: Joi.date().optional().default(new Date())
    })).optional(),
    takenBy: Joi.string().required().trim(),
    notes: Joi.string().trim().max(500).optional()
  }).optional(),
  userId: Joi.string().optional()
});

// Inventory snapshot validation schema
const inventorySnapshotSchema = Joi.object({
  roomId: Joi.string().required(),
  stayId: Joi.string().required(),
  snapshotType: Joi.string().valid('checkin', 'checkout').required(),
  items: Joi.array().items(Joi.object({
    itemName: Joi.string().required().trim(),
    category: Joi.string().required().trim(),
    quantity: Joi.number().integer().min(0).required(),
    condition: Joi.string().valid('excellent', 'good', 'fair', 'poor', 'missing').required(),
    lastChecked: Joi.date().optional().default(new Date())
  })).required(),
  takenBy: Joi.string().required().trim(),
  notes: Joi.string().trim().max(500).optional(),
  userId: Joi.string().optional()
});

// Export validation middleware
export const validateRoomCreation = validateBody(roomCreationSchema);
export const validateRoomStatusUpdate = validateBody(roomStatusUpdateSchema);
export const validateGuestCreation = validateBody(guestCreationSchema);
export const validateCheckIn = validateBody(checkInSchema);
export const validateCheckOut = validateBody(checkOutSchema);
export const validateInventorySnapshot = validateBody(inventorySnapshotSchema);
