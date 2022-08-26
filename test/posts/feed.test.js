const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { app } = require('../../app');
const {
  newUserSignup,
  secondUserSignup,
  createPost,
  followUser
} = require('../utils');

describe('GET /api/posts/feed', () => {
  let mongoServer;
  let userRes;
  let paidUserRes;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    userRes = await newUserSignup(request, app);
    const userToFollowRes = await secondUserSignup(request, app);

    paidUserRes = await request(app).post('/api/users/signup').send({
      firstName: 'paid',
      lastName: 'user',
      username: 'paiduser',
      email: 'paiduser@gmail.com',
      password: '123456',
      type: 'paid'
    });

    await createPost(request, app, userToFollowRes.body.token);
    await createPost(request, app, userToFollowRes.body.token);

    await followUser(
      request,
      app,
      userToFollowRes.body.token,
      userToFollowRes.body.userObj._id
    );

    await followUser(
      request,
      app,
      paidUserRes.body.token,
      userToFollowRes.body.userObj._id
    );
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should return the subscribe msg', async () => {
    const feedRes = await request(app).get('/api/posts/feed').send({
      token: userRes.body.token,
      param: 'dateCreated',
      order: '-1',
      pageNumber: '1'
    });

    const { body } = feedRes;
    expect(body).to.contain.property('error');
  });

  it('should return the feed after subscribed', async () => {
    const feedRes = await request(app).get('/api/posts/feed').send({
      token: paidUserRes.body.token,
      param: 'dateCreated',
      order: '-1',
      pageNumber: '1'
    });

    const { body } = feedRes;
    expect(body).to.contain.property('success');
  });

  it('should return query params required error', async () => {
    const modPostRes = await request(app).get('/api/posts/feed').send({
      token: userRes.body.token,
      param: 'dateCreated',
      order: '-1'
      // pageNumber: '1'
    });

    const { body } = modPostRes;
    expect(body).to.contain.property('error');
  });

  it('should return page does not exist msg', async () => {
    const postRes = await request(app).get('/api/posts/feed').send({
      token: paidUserRes.body.token,
      param: 'dateCreated',
      order: '-1',
      pageNumber: '2'
    });

    const { body } = postRes;
    expect(body).to.contain.property('error');
  });

  it('should throw error if db not connected', async () => {
    await mongoose.disconnect();
    const feedRes = await request(app).get('/api/posts/feed').send({
      token: paidUserRes.body.token,
      param: 'dateCreated',
      order: '-1',
      pageNumber: '1'
    });

    const { body } = feedRes;
    expect(body).to.contain.property('error');
  });
});
