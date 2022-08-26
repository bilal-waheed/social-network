const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');

const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../../app');
const { newUserSignup, createPost } = require('../utils');

describe('GET /api/posts/all', () => {
  let mongoServer;
  let userRes;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    userRes = await newUserSignup(request, app);
    await createPost(request, app, userRes.body.token);
    await createPost(request, app, userRes.body.token);
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should return the success object containing posts', async () => {
    const postsRes = await request(app)
      .get('/api/posts/all')
      .send({
        param: 'dateCreated',
        order: '-1',
        pageNumber: '1'
      })
      .set('token', userRes.body.token);

    const { body } = postsRes;
    expect(body).to.contain.property('success');
  });

  it('should return query params required msg', async () => {
    const postRes = await request(app)
      .get('/api/posts/all')
      .send({
        param: 'dateCreated',
        order: '-1'
      })
      .set('token', userRes.body.token);

    const { body } = postRes;
    expect(body).to.contain.property('error');
  });

  it('should return page does not exist msg', async () => {
    const postRes = await request(app)
      .get('/api/posts/all')
      .send({
        param: 'dateCreated',
        order: '-1',
        pageNumber: '2'
      })
      .set('token', userRes.body.token);

    const { body } = postRes;
    expect(body).to.contain.property('error');
  });

  it('should throw error if db not connected', async () => {
    await mongoose.disconnect();
    const postRes = await request(app)
      .get('/api/posts/all')
      .send({
        param: 'dateCreated',
        order: '-1',
        pageNumber: '2'
      })
      .set('token', userRes.body.token);

    const { body } = postRes;
    expect(body).to.contain.property('error');
  });
});
