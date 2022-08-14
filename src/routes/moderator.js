const express = require('express');
const authenticate = require('../middleware/jwtAuth');
const checkForbidden = require('../middleware/forbidden');

const {
  moderatorSignup,
  moderatorLogin,
  getPosts
} = require('../controllers/moderatorsController');

const router = express.Router();

router.post('/signup', checkForbidden, moderatorSignup);

router.post('/login', checkForbidden, moderatorLogin);

router.get('/posts', authenticate, checkForbidden, getPosts);

module.exports = router;
