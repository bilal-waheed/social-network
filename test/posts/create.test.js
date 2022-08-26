const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');

const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../../app');
const { newUserSignup } = require('../utils');

describe('POST /api/posts/create', () => {
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

  it('should return the success object after post creation', async () => {
    const postsRes = await request(app)
      .post('/api/posts/create')
      .send({
        title: 'new post title',
        content: 'new post content'
      })
      .set('token', userRes.body.token);

    const { body } = postsRes;
    expect(body).to.contain.property('success');
  });

  it('should return error when title/content missing', async () => {
    const postsRes = await request(app)
      .post('/api/posts/create')
      .send({
        title: 'new post title'
        // content: 'new post content'
      })
      .set('token', userRes.body.token);

    const { body } = postsRes;
    expect(body).to.contain.property('error');
  });

  it('should throw error if db not connected', async () => {
    await mongoose.disconnect();
    const postsRes = await request(app)
      .post('/api/posts/create')
      .send({
        title: 'new post title',
        content: 'new post content'
      })
      .set('token', userRes.body.token);

    const { body } = postsRes;
    expect(body).to.contain.property('error');
  });
});
