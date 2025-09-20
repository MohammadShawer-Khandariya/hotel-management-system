export interface Room {
  _id: string;
  roomNumber: string;
  type: 'Single' | 'Double' | 'Suite' | 'Deluxe';
  status: 'Available' | 'Occupied' | 'Not Available';
  floor: number;
  maxOccupancy: number;
  amenities: string[];
  pricePerNight: number;
  __v: number;
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  idType: string;
  idNumber: string;
  dateOfBirth: string;
  nationality: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  preferences: {
    smokingPreference: string;
    bedPreference: string;
    floorPreference?: number;
    specialRequests: string[];
  };
  loyaltyProgram?: {
    memberId?: string;
    tier: string;
    points: number;
  };
  blacklisted: boolean;
  __v: number;
  createdAt: string;
  updatedAt: string;
}

export interface Stay {
  _id: string;
  guestId: string;
  roomId: string;
  checkInDate: string;
  expectedCheckOutDate: string;
  actualCheckOutDate?: string;
  numberOfGuests: number;
  specialRequests?: string;
  totalAmount?: number;
  paymentStatus: 'Pending' | 'Paid' | 'Refunded';
  paymentMethod?: string;
  services: Array<{
    name: string;
    cost: number;
    date: string;
  }>;
  damages: Array<{
    description: string;
    cost: number;
  }>;
  status: 'Active' | 'Completed' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  name: string;
  quantity: number;
  condition: 'Good' | 'Fair' | 'Poor' | 'Damaged';
  value: number;
}

export interface InventorySnapshot {
  _id: string;
  roomId: string;
  stayId?: string;
  type: 'Check-in' | 'Check-out';
  items: InventoryItem[];
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  userId?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
  timestamp: string;
}
