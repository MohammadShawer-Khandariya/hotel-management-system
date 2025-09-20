import mongoose, { Schema, Document } from 'mongoose';
import { IRoom, RoomStatus, RoomType } from '../types';

const RoomSchema = new Schema<IRoom>({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: Object.values(RoomType),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(RoomStatus),
    default: RoomStatus.AVAILABLE
  },
  floor: {
    type: Number,
    required: true,
    min: 1
  },
  amenities: [{
    type: String,
    trim: true
  }],
  pricePerNight: {
    type: Number,
    required: true,
    min: 0
  },
  maxOccupancy: {
    type: Number,
    required: true,
    min: 1
  }
}, {
  timestamps: true
});

// Indexes for performance
RoomSchema.index({ roomNumber: 1 });
RoomSchema.index({ status: 1 });
RoomSchema.index({ type: 1 });
RoomSchema.index({ floor: 1 });

// Virtual for room identification
RoomSchema.virtual('displayName').get(function() {
  return `${this.type} Room ${this.roomNumber}`;
});

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
