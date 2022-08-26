const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { app } = require('../../app');
const { newUserSignup, createPost, newModeratorSignup } = require('../utils');

describe('GET /api/moderators/posts', () => {
  let mongoServer;
  let modRes;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    const userRes = await newUserSignup(request, app);

    await createPost(request, app, userRes.body.token);

    modRes = await newModeratorSignup(request, app);
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should return a success object', async () => {
    const modPostRes = await request(app).get('/api/moderators/posts').send({
      token: modRes.body.token,
      param: 'dateCreated',
      order: '-1',
      pageNumber: '1'
    });

    const { body } = modPostRes;
    expect(body).to.contain.property('success');
  });

  it('should return query params required msg', async () => {
    const modPostRes = await request(app).get('/api/moderators/posts').send({
      token: modRes.body.token,
      param: 'dateCreated',
      order: '-1'
      //   pageNumber: '1'
    });

    const { body } = modPostRes;
    expect(body).to.contain.property('error');
  });

  it('should return page does not exist msg', async () => {
    const modPostRes = await request(app).get('/api/moderators/posts').send({
      token: modRes.body.token,
      param: 'dateCreated',
      order: '-1',
      pageNumber: '2'
    });

    const { body } = modPostRes;
    expect(body).to.contain.property('error');
  });

  it('should throw error if db not connected', async () => {
    await mongoose.disconnect();
    const modPostRes = await request(app)
      .get('/api/moderators/posts')
      .send({
        param: 'dateCreated',
        order: '-1',
        pageNumber: '1'
      })
      .set('token', modRes.body.token);
    const { body } = modPostRes;
    expect(body).to.contain.property('error');
  });
});
