import { Room, Guest, Stay, InventorySnapshot } from '../src/models';
import { RoomType, RoomStatus } from '../src/types';
import { connectMongoDB, disconnectMongoDB } from '../src/config/database';
import logger from '../src/utils/logger';

const seedData = async () => {
  try {
    await connectMongoDB();
    logger.info('Starting database seed...');

    // Clear existing data
    await Promise.all([
      Room.deleteMany({}),
      Guest.deleteMany({}),
      Stay.deleteMany({}),
      InventorySnapshot.deleteMany({})
    ]);

    // Seed rooms
    const rooms = await Room.insertMany([
      {
        roomNumber: '101',
        type: RoomType.SINGLE,
        status: RoomStatus.AVAILABLE,
        floor: 1,
        amenities: ['WiFi', 'TV', 'Air Conditioning'],
        pricePerNight: 99.99,
        maxOccupancy: 1
      },
      {
        roomNumber: '102',
        type: RoomType.DOUBLE,
        status: RoomStatus.AVAILABLE,
        floor: 1,
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar'],
        pricePerNight: 149.99,
        maxOccupancy: 2
      },
      {
        roomNumber: '201',
        type: RoomType.SUITE,
        status: RoomStatus.AVAILABLE,
        floor: 2,
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony', 'Room Service'],
        pricePerNight: 299.99,
        maxOccupancy: 4
      },
      {
        roomNumber: '301',
        type: RoomType.DELUXE,
        status: RoomStatus.OCCUPIED,
        floor: 3,
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony', 'Room Service', 'Jacuzzi'],
        pricePerNight: 399.99,
        maxOccupancy: 2
      },
      {
        roomNumber: '302',
        type: RoomType.SUITE,
        status: RoomStatus.NOT_AVAILABLE,
        floor: 3,
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony'],
        pricePerNight: 279.99,
        maxOccupancy: 3
      }
    ]);

    // Seed guests
    const guests = await Guest.insertMany([
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0123',
        idNumber: 'ID001',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-0456',
        idNumber: 'ID002',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@example.com',
        phone: '+1-555-0789',
        idNumber: 'ID003',
        address: {
          street: '789 Pine Rd',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA'
        }
      }
    ]);

    // Seed stays (some active, some completed)
    const stays = await Stay.insertMany([
      {
        guestId: guests[0]._id,
        roomId: rooms[3]._id, // Deluxe room
        checkInDate: new Date('2024-01-15'),
        plannedCheckOutDate: new Date('2024-01-20'),
        notes: 'Guest requested late checkout',
        status: 'active',
        totalAmount: 1999.95
      },
      {
        guestId: guests[1]._id,
        roomId: rooms[1]._id, // Double room
        checkInDate: new Date('2024-01-10'),
        checkOutDate: new Date('2024-01-12'),
        plannedCheckOutDate: new Date('2024-01-12'),
        status: 'completed',
        totalAmount: 299.98
      }
    ]);

    // Seed inventory snapshots
    const standardRoomItems = [
      { itemName: 'Bath Towel', category: 'towel', quantity: 2, condition: 'excellent', lastChecked: new Date() },
      { itemName: 'Hand Towel', category: 'towel', quantity: 2, condition: 'excellent', lastChecked: new Date() },
      { itemName: 'Bed Sheet', category: 'bedsheet', quantity: 1, condition: 'excellent', lastChecked: new Date() },
      { itemName: 'Pillow Case', category: 'bedsheet', quantity: 2, condition: 'excellent', lastChecked: new Date() },
      { itemName: 'Pillow', category: 'pillow', quantity: 2, condition: 'excellent', lastChecked: new Date() },
      { itemName: 'Blanket', category: 'blanket', quantity: 1, condition: 'excellent', lastChecked: new Date() },
      { itemName: 'TV Remote', category: 'tv remote', quantity: 1, condition: 'excellent', lastChecked: new Date() }
    ] as const;

    await InventorySnapshot.insertMany([
      {
        roomId: rooms[3]._id,
        stayId: stays[0]._id,
        snapshotType: 'checkin',
        items: standardRoomItems,
        takenBy: 'John Staff',
        notes: 'All items in excellent condition'
      },
      {
        roomId: rooms[1]._id,
        stayId: stays[1]._id,
        snapshotType: 'checkin',
        items: standardRoomItems,
        takenBy: 'Jane Staff',
        notes: 'Room ready for guest'
      },
      {
        roomId: rooms[1]._id,
        stayId: stays[1]._id,
        snapshotType: 'checkout',
        items: [
          ...standardRoomItems.slice(0, -1), // All items except TV remote
          { itemName: 'TV Remote', category: 'tv remote', quantity: 0, condition: 'missing', lastChecked: new Date() }
        ],
        takenBy: 'Jane Staff',
        notes: 'TV remote missing - guest will be charged'
      }
    ]);

    logger.info('Database seeded successfully!');
    logger.info(`Created ${rooms.length} rooms`);
    logger.info(`Created ${guests.length} guests`);
    logger.info(`Created ${stays.length} stays`);
    logger.info('Created inventory snapshots');

  } catch (error) {
    logger.error('Error seeding database:', error);
  } finally {
    await disconnectMongoDB();
  }
};

// Run seed if called directly
if (require.main === module) {
  seedData();
}

export default seedData;
