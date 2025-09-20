import request from 'supertest';
import app from '../../index';
import { Room } from '../../models';
import { RoomType, RoomStatus } from '../../types';

describe('Room Controller', () => {
  describe('POST /api/rooms', () => {
    it('should create a new room', async () => {
      const roomData = {
        roomNumber: '101',
        type: RoomType.SINGLE,
        floor: 1,
        amenities: ['WiFi', 'TV'],
        pricePerNight: 99.99,
        maxOccupancy: 1
      };

      const response = await request(app)
        .post('/api/rooms')
        .send(roomData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.roomNumber).toBe(roomData.roomNumber);
      expect(response.body.data.type).toBe(roomData.type);
      expect(response.body.data.status).toBe(RoomStatus.AVAILABLE);
    });

    it('should return 400 for duplicate room number', async () => {
      const roomData = {
        roomNumber: '101',
        type: RoomType.SINGLE,
        floor: 1,
        amenities: ['WiFi'],
        pricePerNight: 99.99,
        maxOccupancy: 1
      };

      // Create first room
      await Room.create(roomData);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/rooms')
        .send(roomData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should return 400 for invalid room data', async () => {
      const invalidRoomData = {
        roomNumber: '', // Invalid empty room number
        type: 'INVALID_TYPE',
        floor: -1, // Invalid negative floor
        pricePerNight: -10 // Invalid negative price
      };

      const response = await request(app)
        .post('/api/rooms')
        .send(invalidRoomData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/rooms', () => {
    beforeEach(async () => {
      // Create test rooms
      await Room.create([
        {
          roomNumber: '101',
          type: RoomType.SINGLE,
          status: RoomStatus.AVAILABLE,
          floor: 1,
          amenities: ['WiFi'],
          pricePerNight: 99.99,
          maxOccupancy: 1
        },
        {
          roomNumber: '102',
          type: RoomType.DOUBLE,
          status: RoomStatus.OCCUPIED,
          floor: 1,
          amenities: ['WiFi', 'TV'],
          pricePerNight: 149.99,
          maxOccupancy: 2
        },
        {
          roomNumber: '201',
          type: RoomType.SUITE,
          status: RoomStatus.AVAILABLE,
          floor: 2,
          amenities: ['WiFi', 'TV', 'Mini Bar'],
          pricePerNight: 299.99,
          maxOccupancy: 4
        }
      ]);
    });

    it('should get all rooms with pagination', async () => {
      const response = await request(app)
        .get('/api/rooms')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rooms).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.totalItems).toBe(3);
    });

    it('should filter rooms by status', async () => {
      const response = await request(app)
        .get('/api/rooms')
        .query({ status: RoomStatus.AVAILABLE })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rooms).toHaveLength(2);
      response.body.data.rooms.forEach((room: any) => {
        expect(room.status).toBe(RoomStatus.AVAILABLE);
      });
    });

    it('should filter rooms by type', async () => {
      const response = await request(app)
        .get('/api/rooms')
        .query({ type: RoomType.SINGLE })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rooms).toHaveLength(1);
      expect(response.body.data.rooms[0].type).toBe(RoomType.SINGLE);
    });

    it('should filter rooms by floor', async () => {
      const response = await request(app)
        .get('/api/rooms')
        .query({ floor: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rooms).toHaveLength(1);
      expect(response.body.data.rooms[0].floor).toBe(2);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/rooms')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rooms).toHaveLength(2);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/rooms/available', () => {
    beforeEach(async () => {
      await Room.create([
        {
          roomNumber: '101',
          type: RoomType.SINGLE,
          status: RoomStatus.AVAILABLE,
          floor: 1,
          amenities: ['WiFi'],
          pricePerNight: 99.99,
          maxOccupancy: 1
        },
        {
          roomNumber: '102',
          type: RoomType.DOUBLE,
          status: RoomStatus.OCCUPIED,
          floor: 1,
          amenities: ['WiFi', 'TV'],
          pricePerNight: 149.99,
          maxOccupancy: 2
        }
      ]);
    });

    it('should get only available rooms', async () => {
      const response = await request(app)
        .get('/api/rooms/available')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe(RoomStatus.AVAILABLE);
    });
  });

  describe('GET /api/rooms/:id', () => {
    let room: any;

    beforeEach(async () => {
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

    it('should get room by ID', async () => {
      const response = await request(app)
        .get(`/api/rooms/${room._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(room._id.toString());
      expect(response.body.data.roomNumber).toBe('101');
    });

    it('should return 404 for non-existent room', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/rooms/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Room not found');
    });

    it('should return 400 for invalid room ID format', async () => {
      const response = await request(app)
        .get('/api/rooms/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/rooms/:id/status', () => {
    let room: any;

    beforeEach(async () => {
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

    it('should update room status', async () => {
      const response = await request(app)
        .patch(`/api/rooms/${room._id}/status`)
        .send({ status: RoomStatus.OCCUPIED })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(RoomStatus.OCCUPIED);

      // Verify in database
      const updatedRoom = await Room.findById(room._id);
      expect(updatedRoom?.status).toBe(RoomStatus.OCCUPIED);
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .patch(`/api/rooms/${room._id}/status`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should return 404 for non-existent room', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .patch(`/api/rooms/${fakeId}/status`)
        .send({ status: RoomStatus.OCCUPIED })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Room not found');
    });
  });
});
