const express = require('express');

const authenticate = require('../middleware/jwtAuth');
const io = require('../socket');

const Post = require('../models/Post');
const User = require('../models/User');

const router = express.Router();

const PER_PAGE_ITEMS = 2;

// protected route
// get the posts of authenticated user
router.get('/all', authenticate, (req, res) => {
  const { param, order, pageNumber } = req.body;
  if (!(param && order && pageNumber))
    return res.status(400).json({ error: 'Query parameters required.' });
  let postsCount;

  const orderSort = {};
  orderSort[param] = order;

  Post.find({ createdBy: req.user.id })
    .count()
    .then((count) => {
      postsCount = count;
      if (pageNumber * PER_PAGE_ITEMS >= postsCount + PER_PAGE_ITEMS)
        return res.status(400).json({ error: 'Page does not exist' });
      Post.find({ createdBy: req.user.id })
        .sort(orderSort)
        .skip((pageNumber - 1) * PER_PAGE_ITEMS)
        .limit(PER_PAGE_ITEMS)
        .then((posts) => {
          if (!posts) return res.status(404).send('No posts found');
          res.status(200).json({
            success: true,
            posts,
            totalPosts: postsCount,
            nextPage: parseInt(pageNumber, 10) + 1,
            hasNextPage: pageNumber * PER_PAGE_ITEMS < postsCount,
            hasPrevPage: pageNumber > 1
          });
        })
        .catch((err) => {
          res.json(err);
        });
    });
});

// protected route
// create a post
router.post('/create', authenticate, (req, res) => {
  if (!(req.body.title && req.body.content)) {
    return res.status(400).send('All fields are required');
  }
  const newPost = new Post({
    title: req.body.title,
    content: req.body.content,
    createdBy: req.user.id
  });

  newPost
    .save()
    .then((post) => {
      io.getIO().emit('posts', { message: 'New post created', post });
      res.status(201).json({ success: true, post });
    })
    .catch((err) => {
      res.json(err);
    });
});

// protected route
// get the feed
router.get('/feed', authenticate, async (req, res) => {
  const { param, order, pageNumber } = req.body;
  if (!(param && order && pageNumber))
    return res.status(400).json({ error: 'Query parameters required.' });
  const userId = req.user.id;
  let postsCount;

  const orderSort = {};
  orderSort[param] = order;

  const user = await User.findOne({ _id: userId });
  const { following } = user;

  Post.find({ createdBy: { $in: following } })
    .count()
    .then((count) => {
      postsCount = count;
      if (pageNumber * PER_PAGE_ITEMS >= postsCount + PER_PAGE_ITEMS)
        return res.status(400).json({ error: 'Page does not exist' });
      Post.find({ createdBy: { $in: following } })
        .sort(orderSort)
        .skip((pageNumber - 1) * PER_PAGE_ITEMS)
        .limit(PER_PAGE_ITEMS)
        .then((posts) => {
          if (!posts) return res.status(404).send('No posts found');
          res.status(200).json({
            success: true,
            posts,
            totalPosts: postsCount,
            nextPage: parseInt(pageNumber, 10) + 1,
            hasNextPage: pageNumber * PER_PAGE_ITEMS < postsCount,
            hasPrevPage: pageNumber > 1
          });
        })
        .catch((err) => {
          res.json(err);
        });
    });
});

// protected route
// update a post
router.patch('/update/:id', authenticate, (req, res) => {
  if (!req.body.id) return res.status(400).json({ error: 'Invalid post id' });
  Post.findOne({ _id: req.params.id })
    .then((post) => {
      if (!post) return res.status(404).json({ error: 'Post not found' });
      if (post.createdBy !== req.user.id)
        return res
          .status(401)
          .json({ error: 'You cannot update a post created by another user.' });

      post.title = req.body.title ? req.body.title : post.title;
      post.content = req.body.content ? req.body.content : post.content;
      post.lastUpdated = Date.now();

      post
        .save()
        .then((updatedPost) => {
          io.getIO().emit('posts', { message: 'A post updated', updatedPost });
          res.status(200).json({
            success: true,
            msg: 'Post updated successfully',
            updatedPost
          });
        })
        .catch((err) => {
          res.status(500).json({ error: err });
        });
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
});

// protected route
// delete a user
router.delete('/delete/:id', authenticate, (req, res) => {
  Post.findOneAndDelete({ _id: req.params.id }).then((post) => {
    if (!post) return res.status(404).json({ error: 'Post does not exist' });

    if (post.createdBy !== req.user.id)
      return res.status(401).json({
        error: 'You cannot delete a post created by another user.'
      });

    return res.status(200).json({
      success: true,
      msg: 'Post deleted successfully'
    });
  });
});

module.exports = router;
