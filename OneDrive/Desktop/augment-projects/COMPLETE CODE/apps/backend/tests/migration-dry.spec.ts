import { execSync } from 'child_process';
import { describe, expect, it } from 'vitest';

describe('Migration Dry Run Tests', () => {
  it('should run migrate deploy without errors', () => {
    const output = execSync('npx prisma migrate deploy', { encoding: 'utf8' });
    expect(output).toContain('Applying migration');
    // No error thrown means success
  });

  it('should validate schema against DB', () => {
    const output = execSync('npx prisma db pull', { encoding: 'utf8' });
    expect(output).toContain('Your database is now in sync with your schema');
  });
});