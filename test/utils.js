const bcrypt = require('bcryptjs');

const createTestUser = async (mongoose) => {
  const User = mongoose.model('users');
  const user = new User({
    firstName: 'test',
    lastName: 'user',
    username: 'testuser',
    email: 'test@gmail.com',
    type: 'unpaid'
  });
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('123456', salt);
  user.password = hash;
  const savedUser = await user.save();
  return savedUser;
};

const newUserSignup = async (request, app) =>
  request(app).post('/api/users/signup').send({
    firstName: 'new',
    lastName: 'user',
    username: 'newuser123',
    email: 'newuser@gmail.com',
    password: '123456'
  });

const secondUserSignup = async (request, app) =>
  request(app).post('/api/users/signup').send({
    firstName: 'second',
    lastName: 'user',
    username: 'seconduser',
    email: 'seconduser@gmail.com',
    password: '123456'
  });

const createPost = async (request, app, token) =>
  request(app)
    .post('/api/posts/create')
    .send({
      title: 'new post title',
      content: 'new post content'
    })
    .set('token', token);

const followUser = async (request, app, token, id) =>
  request(app).patch(`/api/users/follow-user/${id}`).set('token', token);

const newModeratorSignup = async (request, app) =>
  request(app).post('/api/moderators/signup').send({
    firstName: 'new',
    lastName: 'moderator',
    username: 'newmoderator',
    email: 'newmod@gmail.com',
    password: '123456'
  });

module.exports = {
  newUserSignup,
  secondUserSignup,
  createPost,
  followUser,
  createTestUser,
  newModeratorSignup
};
