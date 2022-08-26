const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');

const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../../app');
const { newModeratorSignup } = require('../utils');

describe('POST /api/moderators/login', () => {
  let mongoServer;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    await newModeratorSignup(request, app);
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should return success object on successful login', async () => {
    const modLoginRes = await request(app).post('/api/moderators/login').send({
      username: 'newmoderator',
      password: '123456'
    });
    const { body } = modLoginRes;
    expect(body).to.contain.property('success');
  });

  it('should return error on incorrect password', async () => {
    const modLoginRes = await request(app).post('/api/moderators/login').send({
      username: 'newmoderator',
      password: '123abc'
    });
    const { body } = modLoginRes;
    expect(body).to.contain.property('error');
  });

  it('should throw error if db not connected', async () => {
    await mongoose.disconnect();
    const modLoginRes = await request(app).post('/api/moderators/login').send({
      username: 'newmoderator',
      password: '123456'
    });
    const { body } = modLoginRes;
    expect(body).to.contain.property('error');
  });
});
