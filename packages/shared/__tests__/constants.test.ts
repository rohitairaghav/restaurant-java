import {
  INVENTORY_CATEGORIES,
  UNITS,
  TRANSACTION_REASONS,
  USER_ROLES,
  ALERT_TYPES,
} from '../constants';

describe('Constants', () => {
  describe('INVENTORY_CATEGORIES', () => {
    it('should contain expected categories', () => {
      expect(INVENTORY_CATEGORIES).toContain('Vegetables');
      expect(INVENTORY_CATEGORIES).toContain('Fruits');
      expect(INVENTORY_CATEGORIES).toContain('Meat');
      expect(INVENTORY_CATEGORIES).toContain('Seafood');
      expect(INVENTORY_CATEGORIES).toContain('Dairy');
      expect(INVENTORY_CATEGORIES).toContain('Other');
    });

    it('should have at least 5 categories', () => {
      expect(INVENTORY_CATEGORIES.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('UNITS', () => {
    it('should contain weight units', () => {
      expect(UNITS).toContain('kg');
      expect(UNITS).toContain('g');
      expect(UNITS).toContain('lbs');
      expect(UNITS).toContain('oz');
    });

    it('should contain volume units', () => {
      expect(UNITS).toContain('liters');
      expect(UNITS).toContain('ml');
    });

    it('should contain count units', () => {
      expect(UNITS).toContain('pieces');
      expect(UNITS).toContain('boxes');
      expect(UNITS).toContain('cans');
      expect(UNITS).toContain('bottles');
    });
  });

  describe('TRANSACTION_REASONS', () => {
    it('should have correct stock in reasons', () => {
      expect(TRANSACTION_REASONS.in).toContain('purchase');
      expect(TRANSACTION_REASONS.in).toContain('delivery');
    });

    it('should have correct stock out reasons', () => {
      expect(TRANSACTION_REASONS.out).toContain('sale');
      expect(TRANSACTION_REASONS.out).toContain('waste');
      expect(TRANSACTION_REASONS.out).toContain('transfer');
    });
  });

  describe('USER_ROLES', () => {
    it('should contain manager and staff roles', () => {
      expect(USER_ROLES).toContain('manager');
      expect(USER_ROLES).toContain('staff');
    });

    it('should have exactly 2 roles', () => {
      expect(USER_ROLES).toHaveLength(2);
    });
  });

  describe('ALERT_TYPES', () => {
    it('should contain expected alert types', () => {
      expect(ALERT_TYPES).toContain('low_stock');
      expect(ALERT_TYPES).toContain('out_of_stock');
    });

    it('should have exactly 2 alert types', () => {
      expect(ALERT_TYPES).toHaveLength(2);
    });
  });
});