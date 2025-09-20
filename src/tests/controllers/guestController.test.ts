import request from 'supertest';
import app from '../../index';
import { Guest, Room, Stay } from '../../models';
import { RoomType, RoomStatus } from '../../types';

describe('Guest Controller', () => {
  let guest: any;
  let room: any;

  beforeEach(async () => {
    // Create test guest
    guest = await Guest.create({
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
    });

    // Create test room
    room = await Room.create({
      roomNumber: '101',
      type: RoomType.SINGLE,
      status: RoomStatus.AVAILABLE,
      floor: 1,
      amenities: ['WiFi'],
      pricePerNight: 99.99,
      maxOccupancy: 1
    });
  });

  describe('POST /api/guests', () => {
    it('should create a new guest', async () => {
      const guestData = {
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
      };

      const response = await request(app)
        .post('/api/guests')
        .send(guestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(guestData.firstName);
      expect(response.body.data.email).toBe(guestData.email);
    });

    it('should return 400 for duplicate email', async () => {
      const duplicateGuestData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'john.doe@example.com', // Same as existing guest
        phone: '+1-555-0456',
        idNumber: 'ID002',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      };

      const response = await request(app)
        .post('/api/guests')
        .send(duplicateGuestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should return 400 for invalid email format', async () => {
      const guestData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'invalid-email',
        phone: '+1-555-0456',
        idNumber: 'ID002',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      };

      const response = await request(app)
        .post('/api/guests')
        .send(guestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('POST /api/guests/checkin', () => {
    it('should check in a guest successfully', async () => {
      const checkInData = {
        guestId: guest._id.toString(),
        roomId: room._id.toString(),
        plannedCheckOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        notes: 'Early check-in requested',
        inventorySnapshot: {
          items: [
            {
              itemName: 'Bath Towel',
              category: 'towel',
              quantity: 2,
              condition: 'excellent'
            },
            {
              itemName: 'TV Remote',
              category: 'tv remote',
              quantity: 1,
              condition: 'excellent'
            }
          ],
          takenBy: 'John Staff'
        }
      };

      const response = await request(app)
        .post('/api/guests/checkin')
        .send(checkInData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.guestId).toBeDefined();
      expect(response.body.data.roomId).toBeDefined();

      // Verify room status changed to occupied
      const updatedRoom = await Room.findById(room._id);
      expect(updatedRoom?.status).toBe(RoomStatus.OCCUPIED);
    });

    it('should return 404 for non-existent guest', async () => {
      const fakeGuestId = '507f1f77bcf86cd799439011';
      const checkInData = {
        guestId: fakeGuestId,
        roomId: room._id.toString(),
        plannedCheckOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/guests/checkin')
        .send(checkInData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Guest not found');
    });

    it('should return 404 for non-existent room', async () => {
      const fakeRoomId = '507f1f77bcf86cd799439011';
      const checkInData = {
        guestId: guest._id.toString(),
        roomId: fakeRoomId,
        plannedCheckOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/guests/checkin')
        .send(checkInData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Room not found');
    });

    it('should return 400 for occupied room', async () => {
      // First check-in
      await request(app)
        .post('/api/guests/checkin')
        .send({
          guestId: guest._id.toString(),
          roomId: room._id.toString(),
          plannedCheckOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        })
        .expect(201);

      // Create another guest
      const anotherGuest = await Guest.create({
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
      });

      // Try to check in another guest to same room
      const response = await request(app)
        .post('/api/guests/checkin')
        .send({
          guestId: anotherGuest._id.toString(),
          roomId: room._id.toString(),
          plannedCheckOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not available');
    });
  });

  describe('POST /api/guests/checkout', () => {
    let stay: any;

    beforeEach(async () => {
      // Create an active stay
      stay = await Stay.create({
        guestId: guest._id,
        roomId: room._id,
        checkInDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        plannedCheckOutDate: new Date(),
        status: 'active'
      });

      // Set room as occupied
      room.status = RoomStatus.OCCUPIED;
      await room.save();
    });

    it('should check out a guest successfully', async () => {
      const checkOutData = {
        stayId: stay._id.toString(),
        totalAmount: 199.98,
        inventorySnapshot: {
          items: [
            {
              itemName: 'Bath Towel',
              category: 'towel',
              quantity: 2,
              condition: 'excellent'
            },
            {
              itemName: 'TV Remote',
              category: 'tv remote',
              quantity: 1,
              condition: 'excellent'
            }
          ],
          takenBy: 'Jane Staff'
        }
      };

      const response = await request(app)
        .post('/api/guests/checkout')
        .send(checkOutData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.checkOutDate).toBeDefined();
      expect(response.body.data.totalAmount).toBe(199.98);

      // Verify room status changed to available
      const updatedRoom = await Room.findById(room._id);
      expect(updatedRoom?.status).toBe(RoomStatus.AVAILABLE);
    });

    it('should return 404 for non-existent stay', async () => {
      const fakeStayId = '507f1f77bcf86cd799439011';
      const checkOutData = {
        stayId: fakeStayId,
        totalAmount: 199.98
      };

      const response = await request(app)
        .post('/api/guests/checkout')
        .send(checkOutData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Active stay not found');
    });

    it('should return 404 for already completed stay', async () => {
      // Complete the stay first
      stay.status = 'completed';
      stay.checkOutDate = new Date();
      await stay.save();

      const checkOutData = {
        stayId: stay._id.toString(),
        totalAmount: 199.98
      };

      const response = await request(app)
        .post('/api/guests/checkout')
        .send(checkOutData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Active stay not found');
    });
  });

  describe('GET /api/guests/:id', () => {
    it('should get guest by ID', async () => {
      const response = await request(app)
        .get(`/api/guests/${guest._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(guest._id.toString());
      expect(response.body.data.firstName).toBe('John');
      expect(response.body.data.lastName).toBe('Doe');
    });

    it('should return 404 for non-existent guest', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/guests/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Guest not found');
    });
  });

  describe('GET /api/guests/:id/stays', () => {
    beforeEach(async () => {
      // Create some stays for the guest
      await Stay.create([
        {
          guestId: guest._id,
          roomId: room._id,
          checkInDate: new Date('2024-01-01'),
          checkOutDate: new Date('2024-01-03'),
          plannedCheckOutDate: new Date('2024-01-03'),
          status: 'completed',
          totalAmount: 199.98
        },
        {
          guestId: guest._id,
          roomId: room._id,
          checkInDate: new Date('2024-01-15'),
          plannedCheckOutDate: new Date('2024-01-17'),
          status: 'active'
        }
      ]);
    });

    it('should get guest stay history', async () => {
      const response = await request(app)
        .get(`/api/guests/${guest._id}/stays`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      
      // Should be sorted by check-in date descending
      expect(new Date(response.body.data[0].checkInDate).getTime())
        .toBeGreaterThan(new Date(response.body.data[1].checkInDate).getTime());
    });
  });

  describe('GET /api/guests', () => {
    beforeEach(async () => {
      // Create additional guests
      await Guest.create([
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
    });

    it('should get all guests with pagination', async () => {
      const response = await request(app)
        .get('/api/guests')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.guests).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.totalItems).toBe(3);
    });

    it('should search guests by name', async () => {
      const response = await request(app)
        .get('/api/guests')
        .query({ search: 'Jane' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.guests).toHaveLength(1);
      expect(response.body.data.guests[0].firstName).toBe('Jane');
    });

    it('should search guests by email', async () => {
      const response = await request(app)
        .get('/api/guests')
        .query({ search: 'john.doe' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.guests).toHaveLength(1);
      expect(response.body.data.guests[0].email).toBe('john.doe@example.com');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/guests')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.guests).toHaveLength(2);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });
  });
});
