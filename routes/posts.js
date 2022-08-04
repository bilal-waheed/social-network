const express = require('express');

const authenticate = require('../middleware/jwtAuth');
const io = require('../socket');

const Post = require('../models/Post');
const User = require('../models/User');

const router = express.Router();

const PER_PAGE_ITEMS = 2;

// test route
router.get('/all', (req, res) => {
  Post.find().then((posts) => {
    res.json(posts);
  });
});

// protected route
// create a post
router.post('/create', (req, res) => {
  if (!(req.body.title && req.body.content && req.body.createdBy)) {
    return res.status(400).send('All fields are required');
  }
  const newPost = new Post({
    title: req.body.title,
    content: req.body.content,
    createdBy: req.body.createdBy
  });

  newPost
    .save()
    .then((post) => {
      io.getIO().emit('posts', { message: 'New post created', post });
      res.status(200).json({ success: true, post });
    })
    .catch((err) => {
      res.json(err);
    });
});

// pagination test
// router.get('/page', (req, res) => {
//   const { page } = req.body;
//   let totalPosts;
//   Post.find()
//     .count()
//     .then((count) => {
//       totalPosts = count;
//       return Post.find()
//         .skip((page - 1) * PER_PAGE_ITEMS)
//         .limit(PER_PAGE_ITEMS)
//         .then((posts) => {
//           res.json(posts);
//         });
//     });
// });

// protected route
// get the feed
router.get('/feed', async (req, res) => {
  const { param, order, pageNumber } = req.body;
  const userHandle = req.body.handle;
  let postsCount;
  console.log(pageNumber);

  const orderSort = {};
  orderSort[param] = order;

  const user = await User.findOne({ handle: userHandle });
  const { following } = user;

  Post.find({ createdBy: { $in: following } })
    .count()
    .then((count) => {
      postsCount = count;
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
router.patch('/update', (req, res) => {
  if (!req.body.id) return res.json({ error: 'Invalid post id' });
  Post.findOne({ id: req.body.id })
    .then((post) => {
      if (!post) res.json({ error: 'Post not found' });
      post.title = req.body.title ? req.body.title : post.title;
      post.content = req.body.content ? req.body.content : post.content;
      post.lastUpdated = Date.now();

      post
        .save()
        .then((updatedPost) => {
          io.getIO().emit('posts', { message: 'A post updated', updatedPost });
          res.json({
            success: true,
            msg: 'Post updated successfully',
            updatedPost
          });
        })
        .catch((err) => {
          res.json(err);
        });
    })
    .catch(() => {});
});

// protected route
// delete a user
router.delete('/delete-post', (req, res) => {
  Post.findOneAndDelete({ id: req.body.id }).then((post) => {
    if (!post) return res.json({ error: 'Post does not exist' });
    return res.json({
      success: true,
      msg: 'Post deleted successfully'
    });
  });
});

module.exports = router;
