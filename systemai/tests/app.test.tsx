import { describe, expect, it } from 'vitest';

describe('scaffold sanity', () => {
  it('validates baseline arithmetic', () => {
    expect(1 + 1).toBe(2);
  });
});
