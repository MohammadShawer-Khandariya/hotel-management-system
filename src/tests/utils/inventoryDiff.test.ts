import { compareInventorySnapshots, calculateDiscrepancyCost, generateDiscrepancyReport } from '../../utils/inventoryDiff';
import { IInventorySnapshot, IStay, RoomType, RoomStatus } from '../../types';

describe('Inventory Diff Utils', () => {
  const mockCheckinSnapshot: IInventorySnapshot = {
    roomId: '507f1f77bcf86cd799439011',
    stayId: '507f1f77bcf86cd799439012',
    snapshotType: 'checkin',
    items: [
      {
        itemName: 'Bath Towel',
        category: 'towel',
        quantity: 2,
        condition: 'excellent',
        lastChecked: new Date('2024-01-15T10:00:00Z')
      },
      {
        itemName: 'TV Remote',
        category: 'tv remote',
        quantity: 1,
        condition: 'excellent',
        lastChecked: new Date('2024-01-15T10:00:00Z')
      },
      {
        itemName: 'Pillow',
        category: 'pillow',
        quantity: 2,
        condition: 'excellent',
        lastChecked: new Date('2024-01-15T10:00:00Z')
      }
    ],
    takenBy: 'John Staff',
    createdAt: new Date('2024-01-15T10:00:00Z')
  };

  const mockCheckoutSnapshot: IInventorySnapshot = {
    roomId: '507f1f77bcf86cd799439011',
    stayId: '507f1f77bcf86cd799439012',
    snapshotType: 'checkout',
    items: [
      {
        itemName: 'Bath Towel',
        category: 'towel',
        quantity: 1, // Missing 1 towel
        condition: 'fair', // Condition degraded
        lastChecked: new Date('2024-01-17T12:00:00Z')
      },
      {
        itemName: 'TV Remote',
        category: 'tv remote',
        quantity: 0, // Missing remote
        condition: 'missing',
        lastChecked: new Date('2024-01-17T12:00:00Z')
      },
      {
        itemName: 'Pillow',
        category: 'pillow',
        quantity: 2,
        condition: 'excellent', // No change
        lastChecked: new Date('2024-01-17T12:00:00Z')
      }
    ],
    takenBy: 'Jane Staff',
    createdAt: new Date('2024-01-17T12:00:00Z')
  };

  const mockStay: IStay & { guestId: any; roomId: any } = {
    _id: '507f1f77bcf86cd799439012',
    guestId: {
      firstName: 'John',
      lastName: 'Doe'
    },
    roomId: {
      _id: '507f1f77bcf86cd799439011',
      roomNumber: '101'
    },
    checkInDate: new Date('2024-01-15T14:00:00Z'),
    checkOutDate: new Date('2024-01-17T11:00:00Z'),
    plannedCheckOutDate: new Date('2024-01-17T12:00:00Z'),
    status: 'completed'
  };

  describe('compareInventorySnapshots', () => {
    it('should identify discrepancies correctly', () => {
      const discrepancies = compareInventorySnapshots(mockCheckinSnapshot, mockCheckoutSnapshot);
      
      expect(discrepancies).toHaveLength(2);
      
      // Bath towel discrepancy
      const towelDiscrepancy = discrepancies.find(d => d.itemName === 'Bath Towel');
      expect(towelDiscrepancy).toBeDefined();
      expect(towelDiscrepancy?.quantityDifference).toBe(1);
      expect(towelDiscrepancy?.conditionChanged).toBe(true);
      expect(towelDiscrepancy?.severity).toBe('medium');
      
      // TV Remote discrepancy
      const remoteDiscrepancy = discrepancies.find(d => d.itemName === 'TV Remote');
      expect(remoteDiscrepancy).toBeDefined();
      expect(remoteDiscrepancy?.quantityDifference).toBe(1);
      expect(remoteDiscrepancy?.conditionChanged).toBe(true);
      expect(remoteDiscrepancy?.severity).toBe('high');
    });

    it('should not identify discrepancies when items are identical', () => {
      const identicalSnapshot = { ...mockCheckoutSnapshot };
      identicalSnapshot.items = mockCheckinSnapshot.items;
      
      const discrepancies = compareInventorySnapshots(mockCheckinSnapshot, identicalSnapshot);
      expect(discrepancies).toHaveLength(0);
    });

    it('should handle missing items in checkout', () => {
      const partialCheckoutSnapshot = { ...mockCheckoutSnapshot };
      partialCheckoutSnapshot.items = partialCheckoutSnapshot.items.slice(0, 1); // Only towel
      
      const discrepancies = compareInventorySnapshots(mockCheckinSnapshot, partialCheckoutSnapshot);
      
      // Should find TV remote and pillow as missing
      const remoteDiscrepancy = discrepancies.find(d => d.itemName === 'TV Remote');
      expect(remoteDiscrepancy?.checkoutQuantity).toBe(0);
      expect(remoteDiscrepancy?.checkoutCondition).toBe('missing');
    });

    it('should run in O(n) time complexity', () => {
      // Test with larger datasets to verify performance
      const largeCheckinSnapshot = { ...mockCheckinSnapshot };
      const largeCheckoutSnapshot = { ...mockCheckoutSnapshot };
      
      // Add 1000 items to each snapshot
      for (let i = 0; i < 1000; i++) {
        largeCheckinSnapshot.items.push({
          itemName: `Item ${i}`,
          category: 'test',
          quantity: 1,
          condition: 'excellent',
          lastChecked: new Date()
        });
        
        largeCheckoutSnapshot.items.push({
          itemName: `Item ${i}`,
          category: 'test',
          quantity: 1,
          condition: 'excellent',
          lastChecked: new Date()
        });
      }
      
      const startTime = Date.now();
      const discrepancies = compareInventorySnapshots(largeCheckinSnapshot, largeCheckoutSnapshot);
      const endTime = Date.now();
      
      // Should complete quickly (less than 100ms for 1000+ items)
      expect(endTime - startTime).toBeLessThan(100);
      expect(discrepancies).toHaveLength(2); // Only original discrepancies
    });
  });

  describe('calculateDiscrepancyCost', () => {
    it('should calculate cost correctly for missing items', () => {
      const discrepancies = compareInventorySnapshots(mockCheckinSnapshot, mockCheckoutSnapshot);
      const cost = calculateDiscrepancyCost(discrepancies);
      
      // Bath towel: 15 * 1 (missing) + condition change cost
      // TV Remote: 20 * 1 (missing)
      expect(cost).toBeGreaterThan(30);
    });

    it('should return 0 for no discrepancies', () => {
      const cost = calculateDiscrepancyCost([]);
      expect(cost).toBe(0);
    });

    it('should handle condition changes without quantity differences', () => {
      const conditionOnlyDiscrepancy = [{
        itemName: 'Test Item',
        category: 'test',
        checkinQuantity: 1,
        checkoutQuantity: 1,
        quantityDifference: 0,
        checkinCondition: 'excellent',
        checkoutCondition: 'poor',
        conditionChanged: true,
        severity: 'medium' as const
      }];
      
      const cost = calculateDiscrepancyCost(conditionOnlyDiscrepancy);
      expect(cost).toBeGreaterThan(0);
    });
  });

  describe('generateDiscrepancyReport', () => {
    it('should generate a complete discrepancy report', async () => {
      const report = await generateDiscrepancyReport(
        mockCheckinSnapshot,
        mockCheckoutSnapshot,
        mockStay
      );
      
      expect(report.stayId).toBe(mockStay._id);
      expect(report.roomId).toBe(mockStay.roomId._id);
      expect(report.guestName).toBe('John Doe');
      expect(report.totalDiscrepancies).toBe(2);
      expect(report.estimatedCost).toBeGreaterThan(0);
      expect(report.discrepancies).toHaveLength(2);
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should handle stay without guest information', async () => {
      const stayWithoutGuest = { ...mockStay, guestId: null };
      
      const report = await generateDiscrepancyReport(
        mockCheckinSnapshot,
        mockCheckoutSnapshot,
        stayWithoutGuest
      );
      
      expect(report.guestName).toBe('Unknown Guest');
    });
  });
});
