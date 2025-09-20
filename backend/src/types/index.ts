export enum RoomStatus {
  AVAILABLE = 'Available',
  OCCUPIED = 'Occupied',
  NOT_AVAILABLE = 'Not Available'
}

export enum RoomType {
  SINGLE = 'Single',
  DOUBLE = 'Double',
  SUITE = 'Suite',
  DELUXE = 'Deluxe'
}

export interface IRoom {
  _id?: string;
  roomNumber: string;
  type: RoomType;
  status: RoomStatus;
  floor: number;
  amenities: string[];
  pricePerNight: number;
  maxOccupancy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGuest {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStay {
  _id?: string;
  guestId: string;
  roomId: string;
  checkInDate: Date;
  checkOutDate?: Date;
  plannedCheckOutDate: Date;
  notes?: string;
  totalAmount?: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStayVirtuals {
    duration: number; // Duration in days
}

export interface IInventoryItem {
  itemName: string;
  category: string;
  quantity: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'missing';
  lastChecked: Date;
}

export interface IInventorySnapshot {
  _id?: string;
  roomId: string;
  stayId: string;
  snapshotType: 'checkin' | 'checkout';
  items: IInventoryItem[];
  takenBy: string;
  notes?: string;
  createdAt?: Date;
}

export interface IAuditLogEntry {
  _id?: string;
  action: 'checkin' | 'checkout' | 'room_status_change' | 'inventory_snapshot';
  entityType: 'room' | 'guest' | 'stay' | 'inventory';
  entityId: string;
  userId: string;
  timestamp: Date;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface IDiscrepancy {
  itemName: string;
  category: string;
  checkinQuantity: number;
  checkoutQuantity: number;
  quantityDifference: number;
  checkinCondition: string;
  checkoutCondition: string;
  conditionChanged: boolean;
  severity: 'low' | 'medium' | 'high';
}

export interface IDiscrepancyReport {
  stayId: string;
  roomId: string;
  guestName: string;
  checkInDate: Date;
  checkOutDate: Date;
  discrepancies: IDiscrepancy[];
  totalDiscrepancies: number;
  estimatedCost: number;
  generatedAt: Date;
}
