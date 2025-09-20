// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the hotel-management database
db = db.getSiblingDB("hotel-management");

// Create collections with initial indexes
db.createCollection("rooms");
db.createCollection("guests");
db.createCollection("stays");
db.createCollection("inventorysnapshots");
db.createCollection("auditlogs");

// Create indexes for performance
db.rooms.createIndex({ roomNumber: 1 }, { unique: true });
db.rooms.createIndex({ status: 1 });
db.rooms.createIndex({ type: 1 });
db.rooms.createIndex({ floor: 1 });

db.guests.createIndex({ email: 1 }, { unique: true });
db.guests.createIndex({ idNumber: 1 }, { unique: true });
db.guests.createIndex({ lastName: 1, firstName: 1 });

db.stays.createIndex({ guestId: 1 });
db.stays.createIndex({ roomId: 1 });
db.stays.createIndex({ checkInDate: 1 });
db.stays.createIndex({ checkOutDate: 1 });
db.stays.createIndex({ status: 1 });
db.stays.createIndex({ roomId: 1, status: 1 });

db.inventorysnapshots.createIndex({ roomId: 1 });
db.inventorysnapshots.createIndex({ stayId: 1 });
db.inventorysnapshots.createIndex({ snapshotType: 1 });
db.inventorysnapshots.createIndex({ stayId: 1, snapshotType: 1 });

db.auditlogs.createIndex({ timestamp: -1 });
db.auditlogs.createIndex({ action: 1 });
db.auditlogs.createIndex({ entityType: 1, entityId: 1 });
db.auditlogs.createIndex({ userId: 1 });
db.auditlogs.createIndex({ action: 1, timestamp: -1 });
db.auditlogs.createIndex({ entityId: 1, timestamp: -1 });

print("Hotel Management System database initialized successfully!");
