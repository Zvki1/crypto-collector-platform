import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from 'backend/libs/database/src';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createData = {
        email: 'test@test.com',
        username: 'testuser',
        password: 'hashedPassword',
      };

      const mockUser = {
        id: 'user-1',
        ...createData,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser as any);

      const result = await service.create(createData);

      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: createData,
      });
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        username: 'testuser',
        password: 'hashedPassword',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.findByEmail('test@test.com');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      });
    });

    it('should return null if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await service.findByEmail('notfound@test.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user without password if found', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        username: 'testuser',
        password: 'hashedPassword',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.findById('user-1');

      expect(result).not.toHaveProperty('password');
      expect(result?.id).toBe('user-1');
      expect(result?.email).toBe('test@test.com');
    });

    it('should return null if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await service.findById('notfound');

      expect(result).toBeNull();
    });
  });
});
