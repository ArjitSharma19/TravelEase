const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

describe('Backend Security & Rate Limiting Tests', () => {

  afterAll(async () => {
    // Close mongoose connection after tests complete to avoid open handle leaks
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('Security Headers (Helmet)', () => {
    it('should set essential security headers on responses', async () => {
      const response = await request(app).get('/api/countries-list');

      expect(response.headers['x-dns-prefetch-control']).toBe('off');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-download-options']).toBe('noopen');
      expect(response.headers['x-permitted-cross-domain-policies']).toBe('none');
    });
  });

  describe('Rate Limiting Enforcement', () => {
    it('should include rate limit standard headers on API responses', async () => {
      const response = await request(app).get('/api/countries-list');
      
      // express-rate-limit standard or legacy headers
      const hasRateLimitHeader = 
        response.headers['ratelimit-limit'] !== undefined || 
        response.headers['x-ratelimit-limit'] !== undefined;

      expect(hasRateLimitHeader).toBe(true);
    });

    it('should block excessive login attempts on auth endpoints with HTTP 429', async () => {
      // Auth rate limiter allows 10 attempts
      let lastResponse;
      for (let i = 0; i < 11; i++) {
        lastResponse = await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'wrongpassword' });
      }

      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body).toHaveProperty('error');
      expect(lastResponse.body.error).toContain('Too many login or authentication attempts');
    });
  });
});
