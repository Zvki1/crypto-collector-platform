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

describe('Alerts E2E Tests', () => {
  let app: INestApplication;
  let authToken: string;
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
    console.log('[DEBUG] Crypto ID in beforeEach:', cryptoId);

    // Register and login user
    const userData = {
      email: 'alerts@example.com',
      username: 'alertsuser',
      password: 'Password123!',
    };

    await request(app.getHttpServer()).post('/auth/register').send(userData);

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

  describe('GET /alerts', () => {
    it('should return empty array for new user', async () => {
      const response = await request(app.getHttpServer())
        .get('/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/alerts').expect(401);
    });
  });

  describe('POST /alerts', () => {
    it('should create an alert successfully', async () => {
      const alertDto = {
        cryptocurrencyId: cryptoId,
        type: 'PRICE_ABOVE',
        targetPrice: 100000,
      };

      const response = await request(app.getHttpServer())
        .post('/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(alertDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('type', 'PRICE_ABOVE');
      expect(response.body).toHaveProperty('targetPrice', 100000);
      expect(response.body).toHaveProperty('status', 'ACTIVE');
    });

    it('should fail with invalid condition', async () => {
      const alertDto = {
        cryptocurrencyId: cryptoId,
        type: 'INVALID',
        targetPrice: 100000,
      };

      await request(app.getHttpServer())
        .post('/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(alertDto)
        .expect(400);
    });

    it('should fail with negative price', async () => {
      const alertDto = {
        cryptocurrencyId: cryptoId,
        condition: 'ABOVE',
        targetPrice: -100,
      };

      await request(app.getHttpServer())
        .post('/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(alertDto)
        .expect(400);
    });

    it('should enforce 10-alert limit per user', async () => {
      // Create 10 alerts
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer())
          .post('/alerts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            cryptocurrencyId: cryptoId,
            type: 'PRICE_ABOVE',
            targetPrice: 100000 + i * 1000,
          })
          .expect(201);
      }

      // Try to create 11th alert
      const response = await request(app.getHttpServer())
        .post('/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cryptocurrencyId: cryptoId,
          type: 'PRICE_ABOVE',
          targetPrice: 200000,
        })
        .expect(400);

      expect(response.body.message).toContain('10 alertes');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/alerts')
        .send({
          cryptocurrencyId: cryptoId,
          type: 'PRICE_ABOVE',
          targetPrice: 100000,
        })
        .expect(401);
    });
  });

  describe('DELETE /alerts/:id', () => {
    let alertId: string;

    beforeEach(async () => {
      // Create an alert
      const response = await request(app.getHttpServer())
        .post('/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cryptocurrencyId: cryptoId,
          type: 'PRICE_ABOVE',
          targetPrice: 100000,
        });

      alertId = response.body.id;
    });

    it('should delete an alert successfully', async () => {
      await request(app.getHttpServer())
        .delete(`/alerts/${alertId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify alert is deleted
      const response = await request(app.getHttpServer())
        .get('/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBe(0);
    });

    it('should fail with non-existent alert', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .delete(`/alerts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/alerts/${alertId}`)
        .expect(401);
    });
  });

  describe('Complete Alerts Flow', () => {
    it('should handle complete alert lifecycle', async () => {
      // Step 1: Check empty alerts
      let alertsResponse = await request(app.getHttpServer())
        .get('/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(alertsResponse.body.length).toBe(0);

      // Step 2: Create first alert
      const alert1 = await request(app.getHttpServer())
        .post('/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cryptocurrencyId: cryptoId,
          type: 'PRICE_ABOVE',
          targetPrice: 100000,
        })
        .expect(201);

      // Step 3: Create second alert
      const alert2 = await request(app.getHttpServer())
        .post('/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cryptocurrencyId: cryptoId,
          type: 'PRICE_BELOW',
          targetPrice: 50000,
        })
        .expect(201);

      // Step 4: Verify both alerts exist
      alertsResponse = await request(app.getHttpServer())
        .get('/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(alertsResponse.body.length).toBe(2);
      expect(alertsResponse.body[0].status).toBe('ACTIVE');

      // Step 5: Delete first alert
      await request(app.getHttpServer())
        .delete(`/alerts/${alert1.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Step 6: Verify only one alert remains
      alertsResponse = await request(app.getHttpServer())
        .get('/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(alertsResponse.body.length).toBe(1);
      expect(alertsResponse.body[0].id).toBe(alert2.body.id);

      // Step 7: Delete second alert
      await request(app.getHttpServer())
        .delete(`/alerts/${alert2.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Step 8: Verify all alerts deleted
      alertsResponse = await request(app.getHttpServer())
        .get('/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(alertsResponse.body.length).toBe(0);
    });
  });
});
