const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');

const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../../app');
const { newUserSignup, secondUserSignup, createPost } = require('../utils');

describe('DELETE /api/posts/delete', () => {
  let mongoServer;
  let userRes;
  let postObj;
  let anotherPostObj;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    userRes = await newUserSignup(request, app);
    const anotherUserRes = await secondUserSignup(request, app);

    anotherPostObj = await createPost(request, app, anotherUserRes.body.token);
    postObj = await createPost(request, app, userRes.body.token);
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should return the success object after post delete', async () => {
    const postsRes = await request(app)
      .delete(`/api/posts/delete/${postObj.body.post._id}`)
      .set('token', userRes.body.token);

    const { body } = postsRes;
    expect(body).to.contain.property('success');
  });

  it('should return error when post does not exist', async () => {
    const postsRes = await request(app)
      .delete(`/api/posts/delete/123123123123123123123123`)
      .set('token', userRes.body.token);

    const { body } = postsRes;
    expect(body).to.contain.property('error');
  });

  it('should return error when deleting a post by another user', async () => {
    const postsRes = await request(app)
      .delete(`/api/posts/delete/${anotherPostObj.body.post._id}`)
      .set('token', userRes.body.token);

    const { body } = postsRes;
    expect(body).to.contain.property('error');
  });

  it('should throw error if db not connected', async () => {
    await mongoose.disconnect();
    const postsRes = await request(app)
      .delete(`/api/posts/delete/${postObj.body.post._id}`)
      .set('token', userRes.body.token);

    const { body } = postsRes;
    expect(body).to.contain.property('error');
  });
});
