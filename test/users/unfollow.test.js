const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { app } = require('../../app');
const { newUserSignup, secondUserSignup } = require('../utils');

describe('PATCH /api/users/unfollow-user', () => {
  let mongoServer;
  let userRes;
  let userToUnfollowRes;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    userRes = await newUserSignup(request, app);
    userToUnfollowRes = await secondUserSignup(request, app);
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should return success object on successful unfollow', async () => {
    await request(app)
      .patch(`/api/users/follow-user/${userToUnfollowRes.body.userObj._id}`)
      .set('token', userRes.body.token);

    const unfollowObj = await request(app)
      .patch(`/api/users/unfollow-user/${userToUnfollowRes.body.userObj._id}`)
      .set('token', userRes.body.token);

    const { body } = unfollowObj;
    expect(body).to.contain.property('success');
  });

  it('should return error if user not followed', async () => {
    const unfollowObj = await request(app)
      .patch(`/api/users/unfollow-user/${userToUnfollowRes.body.userObj._id}`)
      .set('token', userRes.body.token);

    const { body } = unfollowObj;
    expect(body).to.contain.property('error');
  });

  it('should throw error if db not connected', async () => {
    await mongoose.disconnect();
    const unfollowObj = await request(app)
      .patch(`/api/users/unfollow-user/${userToUnfollowRes.body.userObj._id}`)
      .set('token', userRes.body.token);

    const { body } = unfollowObj;
    expect(body).to.contain.property('error');
  });
});
