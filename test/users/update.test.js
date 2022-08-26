const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { app } = require('../../app');
const { newUserSignup } = require('../utils');

describe('PATCH /api/users/update', () => {
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

  it('should return success object on successful field update (not password)', async () => {
    const userUpdateRes = await request(app)
      .patch('/api/users/update')
      .send({
        username: 'updateduser'
      })
      .set('token', userRes.body.token);

    const { body } = userUpdateRes;
    expect(body).to.contain.property('success');
  });

  it('should return success object on successful password update', async () => {
    const userUpdateRes = await request(app)
      .patch('/api/users/update')
      .send({
        password: '123456'
      })
      .set('token', userRes.body.token);

    const { body } = userUpdateRes;
    expect(body).to.contain.property('success');
  });

  it('should return unauthorized msg if no token', async () => {
    const userUpdateRes = await request(app).patch('/api/users/update').send({
      username: 'updateduser'
    });

    const { body } = userUpdateRes;
    expect(body).to.contain.property('error');
  });

  it('should throw error if db not connected', async () => {
    await mongoose.disconnect();
    const userUpdateRes = await request(app)
      .patch('/api/users/update')
      .send({
        password: '123456'
      })
      .set('token', userRes.body.token);

    const { body } = userUpdateRes;
    expect(body).to.contain.property('error');
  });
});
