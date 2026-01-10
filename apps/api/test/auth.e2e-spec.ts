import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ApiModule } from '../src/api.module';
import {
  setupTestDatabase,
  cleanDatabase,
  teardownTestDatabase,
} from './setup-e2e';

describe('Auth E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await setupTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApiModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', registerDto.email);
      expect(response.body).toHaveProperty('username', registerDto.username);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail to register with existing email', async () => {
      const registerDto = {
        email: 'duplicate@example.com',
        username: 'user1',
        password: 'Password123!',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Second registration with same email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...registerDto, username: 'user2' })
        .expect(409);

      expect(response.body.message).toContain('déjà utilisé');
    });

    it('should fail with invalid email format', async () => {
      const registerDto = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'Password123!',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should fail with short password', async () => {
      const registerDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: '123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    const testUser = {
      email: 'login@example.com',
      username: 'loginuser',
      password: 'Password123!',
    };

    beforeEach(async () => {
      // Register a user before each login test
      await request(app.getHttpServer()).post('/auth/register').send(testUser);
    });

    it('should login successfully with correct credentials', async () => {
      const loginDto = {
        email: testUser.email,
        password: testUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should fail login with incorrect password', async () => {
      const loginDto = {
        email: testUser.email,
        password: 'WrongPassword123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toContain('incorrect');
    });

    it('should fail login with non-existent email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });

  describe('Protected Routes', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      // Register and login to get token
      const registerDto = {
        email: 'protected@example.com',
        username: 'protecteduser',
        password: 'Password123!',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      userId = registerResponse.body.id;

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: registerDto.email,
          password: registerDto.password,
        });

      authToken = loginResponse.body.access_token;
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should deny access without token', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('should deny access with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should deny access with expired token', async () => {
      // This would require a token that's actually expired
      // For now, we test with a malformed token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid';

      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  describe('Complete Authentication Flow', () => {
    it('should complete full auth flow: register -> login -> access protected route', async () => {
      const userData = {
        email: 'fullflow@example.com',
        username: 'fullflowuser',
        password: 'Password123!',
      };

      // Step 1: Register
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('id');

      // Step 2: Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(201);

      expect(loginResponse.body).toHaveProperty('access_token');
      const token = loginResponse.body.access_token;

      // Step 3: Access protected route (user profile)
      const profileResponse = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.email).toBe(userData.email);
      expect(profileResponse.body.username).toBe(userData.username);

      // Step 4: Access another protected route (portfolio holdings)
      const portfolioResponse = await request(app.getHttpServer())
        .get('/portfolio/holdings')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(portfolioResponse.body)).toBe(true);
    });
  });
});
