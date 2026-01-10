import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@app/database';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let prisma: PrismaService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockPrismaService = {
    portfolio: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        username: 'testuser',
        password: 'hashedPassword',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      jest.spyOn(usersService, 'create').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.portfolio, 'create').mockResolvedValue({} as any);

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(usersService.create).toHaveBeenCalled();
      expect(prisma.portfolio.create).toHaveBeenCalledWith({
        data: { userId: mockUser.id },
      });
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(registerDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@test.com',
        username: 'testuser',
        password: 'password123',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue({
        id: 'user-1',
        email: 'existing@test.com',
      } as any);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      const email = 'test@test.com';
      const password = 'password123';

      const mockUser = {
        id: 'user-1',
        email,
        username: 'testuser',
        password: 'hashedPassword',
        role: 'USER',
      };

      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(result).not.toHaveProperty('password');
      expect(result?.email).toBe(email);
    });

    it('should return null if user not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      const result = await service.validateUser('test@test.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        password: 'hashedPassword',
      };

      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@test.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user on successful login', async () => {
      const loginDto = {
        email: 'test@test.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        username: 'testuser',
        role: 'USER',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser as any);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('mock-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.access_token).toBe('mock-token');
      expect(result.user).toEqual(mockUser);
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      const loginDto = {
        email: 'test@test.com',
        password: 'wrongpassword',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
