import { IInventorySnapshot, IDiscrepancy, IDiscrepancyReport, IStay } from '../types';

/**
 * Efficient O(n) inventory comparison utility
 * Compares check-in and check-out inventory snapshots to identify discrepancies
 */
export const compareInventorySnapshots = (
  checkinSnapshot: IInventorySnapshot,
  checkoutSnapshot: IInventorySnapshot
): IDiscrepancy[] => {
  const discrepancies: IDiscrepancy[] = [];
  
  // Create maps for O(1) lookup
  const checkinItemsMap = new Map<string, any>();
  const checkoutItemsMap = new Map<string, any>();
  
  // Build check-in items map
  checkinSnapshot.items.forEach(item => {
    const key = `${item.itemName}-${item.category}`;
    checkinItemsMap.set(key, item);
  });
  
  // Build check-out items map
  checkoutSnapshot.items.forEach(item => {
    const key = `${item.itemName}-${item.category}`;
    checkoutItemsMap.set(key, item);
  });
  
  // Get all unique item keys
  const allItemKeys = new Set([
    ...checkinItemsMap.keys(),
    ...checkoutItemsMap.keys()
  ]);
  
  // Compare items - O(n) complexity
  allItemKeys.forEach(itemKey => {
    const checkinItem = checkinItemsMap.get(itemKey);
    const checkoutItem = checkoutItemsMap.get(itemKey);
    
    const checkinQuantity = checkinItem?.quantity || 0;
    const checkoutQuantity = checkoutItem?.quantity || 0;
    const quantityDifference = checkinQuantity - checkoutQuantity;
    
    const checkinCondition = checkinItem?.condition || 'missing';
    const checkoutCondition = checkoutItem?.condition || 'missing';
    const conditionChanged = checkinCondition !== checkoutCondition;
    
    // Only create discrepancy if there's a difference
    if (quantityDifference !== 0 || conditionChanged) {
      const [itemName, category] = itemKey.split('-');
      
      let severity: 'low' | 'medium' | 'high' = 'low';
      
      // Determine severity based on quantity difference and condition change
      if (Math.abs(quantityDifference) > 2 || checkoutCondition === 'missing') {
        severity = 'high';
      } else if (Math.abs(quantityDifference) > 0 || 
                 (checkinCondition === 'excellent' && ['poor', 'fair'].includes(checkoutCondition))) {
        severity = 'medium';
      }
      
      discrepancies.push({
        itemName,
        category,
        checkinQuantity,
        checkoutQuantity,
        quantityDifference,
        checkinCondition,
        checkoutCondition,
        conditionChanged,
        severity
      });
    }
  });
  
  return discrepancies;
};

/**
 * Calculate estimated cost based on discrepancies
 * This is a simple cost calculation - you can make it more sophisticated
 */
export const calculateDiscrepancyCost = (discrepancies: IDiscrepancy[]): number => {
  const costMap: Record<string, number> = {
    // Sample cost per item category
    'towel': 15,
    'bedsheet': 25,
    'pillow': 30,
    'blanket': 40,
    'curtain': 50,
    'tv remote': 20,
    'lamp': 35,
    'mirror': 45,
    'chair': 100,
    'table': 150,
    'default': 20
  };
  
  return discrepancies.reduce((total, discrepancy) => {
    const itemCost = costMap[discrepancy.category.toLowerCase()] || costMap.default;
    let cost = 0;
    
    // Cost calculation based on quantity difference
    if (discrepancy.quantityDifference > 0) {
      // Items missing from checkout
      cost += Math.abs(discrepancy.quantityDifference) * itemCost;
    }
    
    // Additional cost for condition degradation
    if (discrepancy.conditionChanged) {
      const conditionCostMultiplier: Record<string, number> = {
        'excellent': 0,
        'good': 0.1,
        'fair': 0.3,
        'poor': 0.7,
        'missing': 1.0
      };
      
      const checkinMultiplier = conditionCostMultiplier[discrepancy.checkinCondition] || 0;
      const checkoutMultiplier = conditionCostMultiplier[discrepancy.checkoutCondition] || 0;
      
      if (checkoutMultiplier > checkinMultiplier) {
        cost += (checkoutMultiplier - checkinMultiplier) * itemCost * discrepancy.checkoutQuantity;
      }
    }
    
    return total + cost;
  }, 0);
};

/**
 * Generate comprehensive discrepancy report
 */
export const generateDiscrepancyReport = async (
  checkinSnapshot: IInventorySnapshot,
  checkoutSnapshot: IInventorySnapshot,
  stay: IStay & { guestId: any; roomId: any }
): Promise<IDiscrepancyReport> => {
  const discrepancies = compareInventorySnapshots(checkinSnapshot, checkoutSnapshot);
  const estimatedCost = calculateDiscrepancyCost(discrepancies);
  
  return {
    stayId: stay._id!,
    roomId: stay.roomId._id || stay.roomId,
    guestName: stay.guestId ? 
      `${stay.guestId.firstName} ${stay.guestId.lastName}` : 
      'Unknown Guest',
    checkInDate: stay.checkInDate,
    checkOutDate: stay.checkOutDate || new Date(),
    discrepancies,
    totalDiscrepancies: discrepancies.length,
    estimatedCost,
    generatedAt: new Date()
  };
};

/**
 * Filter discrepancies by severity
 */
export const filterDiscrepanciesBySeverity = (
  discrepancies: IDiscrepancy[],
  severity: 'low' | 'medium' | 'high'
): IDiscrepancy[] => {
  return discrepancies.filter(d => d.severity === severity);
};

/**
 * Get discrepancy summary statistics
 */
export const getDiscrepancySummary = (discrepancies: IDiscrepancy[]) => {
  const summary = discrepancies.reduce((acc, discrepancy) => {
    acc.total++;
    acc.severityCount[discrepancy.severity]++;
    acc.totalMissingItems += Math.max(0, discrepancy.quantityDifference);
    
    if (discrepancy.conditionChanged) {
      acc.conditionChanges++;
    }
    
    return acc;
  }, {
    total: 0,
    severityCount: { low: 0, medium: 0, high: 0 },
    totalMissingItems: 0,
    conditionChanges: 0
  });
  
  return summary;
};
