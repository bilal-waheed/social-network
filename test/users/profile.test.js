const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { app } = require('../../app');
const { newUserSignup } = require('../utils');

describe('GET /api/users/profile', () => {
  let mongoServer;
  let userRes;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    userRes = await newUserSignup(request, app);
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should return success object ', async () => {
    const profileRes = await request(app)
      .get('/api/users/profile')
      .set('token', userRes.body.token);

    const { body } = profileRes;
    expect(body).to.contain.property('success');
  });

  it('should throw error if db not connected', async () => {
    await mongoose.disconnect();
    const profileRes = await request(app)
      .get('/api/users/profile')
      .set('token', userRes.body.token);

    const { body } = profileRes;
    expect(body).to.contain.property('error');
  });
});
