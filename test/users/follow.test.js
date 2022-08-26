const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { app } = require('../../app');
const { newUserSignup, secondUserSignup } = require('../utils');

describe('PATCH /api/users/follow-user', () => {
  let mongoServer;
  let userRes;
  let userToFollowRes;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    userRes = await newUserSignup(request, app);
    userToFollowRes = await secondUserSignup(request, app);
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should return success object on successful follow', async () => {
    const followObj = await request(app)
      .patch(`/api/users/follow-user/${userToFollowRes.body.userObj._id}`)
      .set('token', userRes.body.token);

    const { body } = followObj;
    expect(body).to.contain.property('success');
  });

  it('should return error if user already followed', async () => {
    await request(app)
      .patch(`/api/users/follow-user/${userToFollowRes.body.userObj._id}`)
      .set('token', userRes.body.token);

    const followObjSecond = await request(app)
      .patch(`/api/users/follow-user/${userToFollowRes.body.userObj._id}`)
      .set('token', userRes.body.token);

    const { body } = followObjSecond;
    expect(body).to.contain.property('error');
  });

  it('should throw error if db not connected', async () => {
    await mongoose.disconnect();
    const followObj = await request(app)
      .patch(`/api/users/follow-user/${userToFollowRes.body.userObj._id}`)
      .set('token', userRes.body.token);

    const { body } = followObj;
    expect(body).to.contain.property('error');
  });
});
