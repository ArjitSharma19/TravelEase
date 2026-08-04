const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

describe('Backend API Contract Tests', () => {

  afterAll(async () => {
    // Close mongoose connection after tests complete to avoid open handle leaks
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('Public API Endpoints', () => {
    it('GET /api/countries-list should return list of countries', async () => {
      const response = await request(app).get('/api/countries-list');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('name');
    });

    it('GET /api/comments/top/testimonials should return testimonials array', async () => {
      const response = await request(app).get('/api/comments/top/testimonials');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Auth Validation & Security Endpoints', () => {
    it('POST /api/auth/login with empty credentials should return 400', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/email and password are required/i);
    });

    it('POST /api/auth/signup with invalid email format should return 400', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email-format',
          password: 'Password123!',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/invalid email/i);
    });

    it('GET /api/auth/profile without token should return 401', async () => {
      const response = await request(app).get('/api/auth/profile');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/authentication required/i);
    });
  });
});
