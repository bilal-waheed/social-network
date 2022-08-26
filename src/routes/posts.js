const express = require('express');

const authenticate = require('../middleware/jwtAuth');

const {
  getAllPosts,
  createPost,
  getFeed,
  updatePost,
  deletePost
} = require('../controllers/postsController');

const router = express.Router();

router.get('/all', authenticate, getAllPosts);

router.post('/create', authenticate, createPost);

router.get('/feed', authenticate, getFeed);

router.patch('/update/:id', authenticate, updatePost);

router.delete('/delete/:id', authenticate, deletePost);

module.exports = router;
