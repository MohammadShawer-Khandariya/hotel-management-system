import { Schema, Model, model } from 'mongoose';
import { IStay, IStayVirtuals } from '../types';

type UserModelType = Model<IStay, {}, {}, IStayVirtuals>;

const StaySchema = new Schema<IStay, UserModelType, {}, IStayVirtuals>({
  guestId: {
    type: String,
    required: true,
    ref: 'Guest'
  },
  roomId: {
    type: String,
    required: true,
    ref: 'Room'
  },
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    default: null
  },
  plannedCheckOutDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  totalAmount: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
    virtuals: {
        duration: {
            get: function(this: IStay) {
                const endDate = this.checkOutDate || new Date();
                const startDate = this.checkInDate;
                const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
        }
    },
  timestamps: true
});

// Indexes for performance
StaySchema.index({ guestId: 1 });
StaySchema.index({ roomId: 1 });
StaySchema.index({ checkInDate: 1 });
StaySchema.index({ checkOutDate: 1 });
StaySchema.index({ status: 1 });
StaySchema.index({ roomId: 1, status: 1 });


export const Stay = model<IStay, UserModelType>('Stay', StaySchema);
