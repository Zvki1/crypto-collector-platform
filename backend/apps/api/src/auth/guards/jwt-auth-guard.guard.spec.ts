import { JwtAuthGuard } from './jwt-auth-guard.guard';

import { JwtService } from '@nestjs/jwt';

describe('JwtAuthGuard', () => {
  it('should be defined', () => {
    const mockJwtService = {
      verifyAsync: jest.fn(),
    } as unknown as JwtService;
    expect(new JwtAuthGuard(mockJwtService)).toBeDefined();
  });
});
