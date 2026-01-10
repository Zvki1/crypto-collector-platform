import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ApiModule } from '../src/api.module';
import {
  setupTestDatabase,
  cleanDatabase,
  teardownTestDatabase,
  createTestCrypto,
} from './setup-e2e';

describe('Portfolio E2E Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let cryptoId: string;

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

    // Get the shared crypto (already created in setupTestDatabase)
    const crypto = await createTestCrypto();
    cryptoId = crypto.id;
    console.log('[TEST DEBUG] Crypto ID from createTestCrypto():', cryptoId);

    // Register and login user
    const userData = {
      email: 'portfolio@example.com',
      username: 'portfoliouser',
      password: 'Password123!',
    };

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(userData);

    userId = registerResponse.body.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  });

  describe('GET /portfolio/holdings', () => {
    it('should return empty portfolio for new user', async () => {
      const response = await request(app.getHttpServer())
        .get('/portfolio/holdings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/portfolio/holdings').expect(401);
    });
  });

  describe('POST /portfolio/transaction', () => {
    it('should create a BUY transaction successfully', async () => {
      const transactionDto = {
        type: 'BUY',
        amount: 1.5,
        cryptocurrencyId: cryptoId,
      };

      const response = await request(app.getHttpServer())
        .post('/portfolio/transaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('type', 'BUY');
      expect(response.body).toHaveProperty('amount');
      expect(response.body).toHaveProperty('price');
      expect(response.body).toHaveProperty('totalValue');
    });

    it('should fail to sell more than owned', async () => {
      // Try to sell without owning any
      const transactionDto = {
        type: 'SELL',
        amount: 1.0,
        cryptocurrencyId: cryptoId,
      };

      const response = await request(app.getHttpServer())
        .post('/portfolio/transaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionDto)
        .expect(400);

      expect(response.body.message).toContain('possédez');
    });

    it('should create a SELL transaction after BUY', async () => {
      // First buy
      await request(app.getHttpServer())
        .post('/portfolio/transaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'BUY',
          amount: 2.0,
          cryptocurrencyId: cryptoId,
        });

      // Then sell
      const sellTransaction = {
        type: 'SELL',
        amount: 1.0,
        cryptocurrencyId: cryptoId,
      };

      const response = await request(app.getHttpServer())
        .post('/portfolio/transaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sellTransaction)
        .expect(201);

      expect(response.body.type).toBe('SELL');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/portfolio/transaction')
        .send({
          type: 'BUY',
          amount: 1.0,
          cryptocurrencyId: cryptoId,
        })
        .expect(401);
    });
  });

  describe('GET /portfolio/transactions', () => {
    beforeEach(async () => {
      // Create some transactions
      await request(app.getHttpServer())
        .post('/portfolio/transaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'BUY',
          amount: 1.0,
          cryptocurrencyId: cryptoId,
        });

      await request(app.getHttpServer())
        .post('/portfolio/transaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'BUY',
          amount: 0.5,
          cryptocurrencyId: cryptoId,
        });
    });

    it('should return all transactions for user', async () => {
      const response = await request(app.getHttpServer())
        .get('/portfolio/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('type');
      expect(response.body[0]).toHaveProperty('amount');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/portfolio/transactions')
        .expect(401);
    });
  });

  describe('GET /portfolio/overview', () => {
    beforeEach(async () => {
      // Create a BUY transaction
      await request(app.getHttpServer())
        .post('/portfolio/transaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'BUY',
          amount: 2.0,
          cryptocurrencyId: cryptoId,
        });
    });

    it('should return portfolio overview with statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/portfolio/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalValue');
      expect(response.body).toHaveProperty('totalInvested');
      expect(response.body).toHaveProperty('pl'); // Profit/Loss
      expect(response.body).toHaveProperty('roi'); // Return on Investment
      expect(typeof response.body.totalValue).toBe('number');
      expect(typeof response.body.totalInvested).toBe('number');
    });
  });

  describe('Complete Portfolio Flow', () => {
    it('should handle complete transaction lifecycle', async () => {
      // Step 1: Check empty portfolio
      let portfolioResponse = await request(app.getHttpServer())
        .get('/portfolio/holdings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(portfolioResponse.body).toEqual([]);

      // Step 2: Buy 2 BTC
      await request(app.getHttpServer())
        .post('/portfolio/transaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'BUY',
          amount: 2.0,
          cryptocurrencyId: cryptoId,
        })
        .expect(201);

      // Step 3: Check portfolio has holdings
      portfolioResponse = await request(app.getHttpServer())
        .get('/portfolio/holdings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(portfolioResponse.body.length).toBeGreaterThan(0);
      expect(portfolioResponse.body[0]).toHaveProperty('quantity');

      // Step 4: Check transactions list
      const transactionsResponse = await request(app.getHttpServer())
        .get('/portfolio/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(transactionsResponse.body.length).toBe(1);
      expect(transactionsResponse.body[0].type).toBe('BUY');

      // Step 5: Sell 1 BTC
      await request(app.getHttpServer())
        .post('/portfolio/transaction')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'SELL',
          amount: 1.0,
          cryptocurrencyId: cryptoId,
        })
        .expect(201);

      // Step 6: Check updated transactions
      const updatedTransactions = await request(app.getHttpServer())
        .get('/portfolio/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(updatedTransactions.body.length).toBe(2);

      // Step 7: Check portfolio overview
      const overviewResponse = await request(app.getHttpServer())
        .get('/portfolio/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(overviewResponse.body).toHaveProperty('totalValue');
      expect(overviewResponse.body).toHaveProperty('pl');
      expect(overviewResponse.body).toHaveProperty('roi');
    });
  });
});
