const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');

const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../../app');
const { newUserSignup } = require('../utils');

describe('POST /api/users/signup', () => {
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

  it('should return success object on successful signup', async () => {
    const signUpRes = await request(app).post('/api/users/signup').send({
      firstName: 'new',
      lastName: 'user',
      username: 'newusersignup',
      email: 'newuser@gmail.com',
      password: '123456'
    });
    const { body } = signUpRes;
    expect(body).to.contain.property('success');
  });

  it('should return user already exists msg', async () => {
    const userResSecond = await request(app).post('/api/users/signup').send({
      firstName: 'new',
      lastName: 'user',
      username: 'newuser123',
      email: 'newuser@gmail.com',
      password: '123456'
    });
    const { body } = userResSecond;
    expect(body).to.contain.property('error');
  });

  it('should throw error if db not connected', async () => {
    await mongoose.disconnect();
    const res = await request(app).post('/api/users/signup').send({
      firstName: 'new',
      lastName: 'user',
      username: 'newuser123123',
      email: 'newuser@gmail.com',
      password: '123456'
    });
    const { body } = res;
    expect(body).to.contain.property('error');
  });
});
