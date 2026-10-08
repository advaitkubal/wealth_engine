import { describe, it, expect } from 'vitest';

describe('Frontend Smoke Test', () => {
  it('verifies basic math and test runner setup', () => {
    expect(1 + 1).toBe(2);
  });

  it('formats Indian currency correctly in JS/TS', () => {
    const formatINR = (val: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(val);
    };

    expect(formatINR(125000)).toBe('₹1,25,000');
    expect(formatINR(10000000)).toBe('₹1,00,00,000');
  });
});
