const express = require('express');
const authenticate = require('../middleware/jwtAuth');

const {
  moderatorSignup,
  moderatorLogin,
  getPosts
} = require('../controllers/moderatorsController');

const router = express.Router();

router.post('/signup', moderatorSignup);

router.post('/login', moderatorLogin);

router.get('/posts', authenticate, getPosts);

module.exports = router;
