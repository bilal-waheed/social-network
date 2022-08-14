const express = require('express');
const authenticate = require('../middleware/jwtAuth');

const {
  userSignUp,
  userLogin,
  userUpdate,
  userDelete,
  userFollow,
  userUnfollow,
  userProfile
} = require('../controllers/usersController');

const router = express.Router();

router.post('/signup', userSignUp);

router.post('/login', userLogin);

router.get('/profile', authenticate, userProfile);

router.patch('/update/', authenticate, userUpdate);

router.delete('/delete/', authenticate, userDelete);

router.patch('/follow-user/:id', authenticate, userFollow);

router.patch('/unfollow-user/:id', authenticate, userUnfollow);

module.exports = router;
