const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');

const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../../app');
const { newModeratorSignup } = require('../utils');

describe('POST /api/moderators/signup', () => {
  let mongoServer;
  let modRes;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should return success object on successful signup', async () => {
    modRes = await request(app).post('/api/moderators/signup').send({
      firstName: 'new',
      lastName: 'moderator',
      username: 'newmoderator',
      email: 'newmod@gmail.com',
      password: '123456'
    });
    const { body } = modRes;
    expect(body).to.contain.property('success');
  });

  it('should return moderator already exists msg', async () => {
    const modResSecond = await newModeratorSignup(request, app);
    const { body } = modResSecond;
    expect(body).to.contain.property('error');
  });

  it('should throw error if db not connected', async () => {
    await mongoose.disconnect();
    const anotherModRes = await newModeratorSignup(request, app);

    const { body } = anotherModRes;
    expect(body).to.contain.property('error');
  });
});
