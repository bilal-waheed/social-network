const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { app } = require('../../app');
const { createTestUser } = require('../utils');

describe('POST /api/users/login', () => {
  let mongoServer;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    userRes = await createTestUser(mongoose);
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should return success object on successful login', async () => {
    const userLoginRes = await request(app).post('/api/users/login').send({
      username: 'testuser',
      password: '123456'
    });

    const { body } = userLoginRes;

    expect(body).to.contain.property('success');
  });

  it('should return error on incorrect password', async () => {
    const userLoginRes = await request(app).post('/api/users/login').send({
      username: 'testuser',
      password: '123abc'
    });
    const { body } = userLoginRes;
    expect(body).to.contain.property('error');
  });

  it('should throw error if db not connected', async () => {
    await mongoose.disconnect();
    const userLoginRes = await request(app).post('/api/users/login').send({
      username: 'testuser',
      password: '123456'
    });
    const { body } = userLoginRes;
    expect(body).to.contain.property('error');
  });
});
