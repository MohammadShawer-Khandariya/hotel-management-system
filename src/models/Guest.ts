import mongoose, { Schema, Document } from 'mongoose';
import { IGuest } from '../types';

const AddressSchema = new Schema({
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  zipCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true }
}, { _id: false });

const GuestSchema = new Schema<IGuest>({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  idNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  address: {
    type: AddressSchema,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for performance
GuestSchema.index({ email: 1 });
GuestSchema.index({ idNumber: 1 });
GuestSchema.index({ lastName: 1, firstName: 1 });

// Virtual for full name
GuestSchema.virtual('fullName').get(function(this: IGuest) {
  return `${this.firstName} ${this.lastName}`;
});

export const Guest = mongoose.model<IGuest>('Guest', GuestSchema);
