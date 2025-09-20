import mongoose, { Schema, Document } from 'mongoose';
import { IAuditLogEntry } from '../types';

const AuditLogSchema = new Schema<IAuditLogEntry>({
  action: {
    type: String,
    enum: ['checkin', 'checkout', 'room_status_change', 'inventory_snapshot'],
    required: true
  },
  entityType: {
    type: String,
    enum: ['room', 'guest', 'stay', 'inventory'],
    required: true
  },
  entityId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  details: {
    type: Schema.Types.Mixed,
    required: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  }
}, {
  timestamps: false // We have our own timestamp field
});

// Indexes for performance and querying
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ entityId: 1, timestamp: -1 });

// Ensure this is append-only by removing update methods
// AuditLogSchema.methods.save = function() {
//   if (this.isNew) {
//     return Schema.prototype.save.call(this);
//   }
//   throw new Error('Audit logs are immutable and cannot be updated');
// };

export const AuditLog = mongoose.model<IAuditLogEntry>('AuditLog', AuditLogSchema);
