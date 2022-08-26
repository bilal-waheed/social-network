const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { app } = require('../../app');
const { newUserSignup } = require('../utils');

describe('DELETE /api/users/delete', () => {
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

  it('should return success object on user delete', async () => {
    const userDeleteRes = await request(app)
      .delete('/api/users/delete')
      .set('token', userRes.body.token);

    const { body } = userDeleteRes;
    expect(body).to.contain.property('success');
  });

  it('should return unauthorized msg if no token', async () => {
    const userDeleteRes = await request(app).delete('/api/users/delete');
    const { body } = userDeleteRes;
    expect(body).to.contain.property('error');
  });

  it('should throw error if db not connected', async () => {
    await mongoose.disconnect();

    const userDeleteRes = await request(app)
      .delete('/api/users/delete')
      .set('token', userRes.body.token);

    const { body } = userDeleteRes;

    expect(body).to.contain.property('error');
  });
});
