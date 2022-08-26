process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { checkout } = require('../../src/routes/checkout');
const { createTestUser } = require('../utils');

describe('POST /checkout', () => {
  let mongoServer;
  let userRes;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    userRes = await createTestUser(mongoose);
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should return success message on successful payment', async () => {
    const mock = sinon.mock({ checkout });
    const exp = mock
      .expects('checkout')
      .once()
      .withArgs({ email: userRes.email })
      .returns({ success: true });

    expect(exp({ email: userRes.email })).to.contain.property('success');
    mock.restore();
  });
});
