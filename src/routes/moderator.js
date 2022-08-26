const express = require('express');
const authenticate = require('../middleware/jwtAuth');
const checkForbidden = require('../middleware/forbidden');

const {
  moderatorSignup,
  moderatorLogin,
  getPosts
} = require('../controllers/moderatorsController');

const router = express.Router();

router.post('/signup', moderatorSignup); // checkForbidden

router.post('/login', moderatorLogin); // checkForbidden

router.get('/posts', authenticate, checkForbidden, getPosts);

module.exports = router;
