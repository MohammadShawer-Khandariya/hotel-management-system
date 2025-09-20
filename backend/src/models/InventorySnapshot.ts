import mongoose, { Schema, Document } from 'mongoose';
import { IInventorySnapshot, IInventoryItem } from '../types';

const InventoryItemSchema = new Schema<IInventoryItem>({
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'missing'],
    required: true
  },
  lastChecked: {
    type: Date,
    required: true,
    default: Date.now
  }
}, { _id: false });

const InventorySnapshotSchema = new Schema<IInventorySnapshot>({
  roomId: {
    type: String,
    required: true,
    ref: 'Room'
  },
  stayId: {
    type: String,
    required: true,
    ref: 'Stay'
  },
  snapshotType: {
    type: String,
    enum: ['checkin', 'checkout'],
    required: true
  },
  items: [InventoryItemSchema],
  takenBy: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for performance
InventorySnapshotSchema.index({ roomId: 1 });
InventorySnapshotSchema.index({ stayId: 1 });
InventorySnapshotSchema.index({ snapshotType: 1 });
InventorySnapshotSchema.index({ stayId: 1, snapshotType: 1 });

export const InventorySnapshot = mongoose.model<IInventorySnapshot>('InventorySnapshot', InventorySnapshotSchema);
