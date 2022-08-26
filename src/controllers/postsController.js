const Post = require('../models/Post');
const User = require('../models/User');
const io = require('../socketio/socket');

const PER_PAGE_ITEMS = 2;

const getAllPosts = async (req, res) => {
  try {
    const { param, order, pageNumber } = req.body;
    if (!(param && order && pageNumber))
      return res.status(400).json({ error: 'Query parameters required.' });

    const orderSort = {};
    orderSort[param] = order;

    const postsCount = await Post.find({ createdBy: req.user.id }).count();

    if (pageNumber * PER_PAGE_ITEMS >= postsCount + PER_PAGE_ITEMS)
      return res.status(400).json({ error: 'Page does not exist' });

    const posts = await Post.find({ createdBy: req.user.id })
      .sort(orderSort)
      .skip((pageNumber - 1) * PER_PAGE_ITEMS)
      .limit(PER_PAGE_ITEMS);

    if (!posts) return res.status(404).send('No posts found');

    res.status(200).json({
      success: true,
      posts,
      totalPosts: postsCount,
      nextPage: parseInt(pageNumber, 10) + 1,
      hasNextPage: pageNumber * PER_PAGE_ITEMS < postsCount,
      hasPrevPage: pageNumber > 1
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const createPost = async (req, res) => {
  try {
    if (!(req.body.title && req.body.content)) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const newPost = new Post({
      title: req.body.title,
      content: req.body.content,
      createdBy: req.user.id
    });

    const post = await newPost.save();

    io.getIO().emit('posts', { message: 'New post created', post });
    res.status(201).json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const getFeed = async (req, res) => {
  try {
    const { param, order, pageNumber } = req.body;

    if (!(param && order && pageNumber))
      return res.status(400).json({ error: 'Query parameters required.' });

    const userId = req.user.id;

    const orderSort = {};
    orderSort[param] = order;

    const user = await User.findOne({ _id: userId });
    if (user.type === 'unpaid')
      return res.status(401).json({
        error:
          'Buy the subscription to view the feed. Go to {DOMAIN_NAME}/checkout'
      });

    const { following } = user;

    const postsCount = await Post.find({
      createdBy: { $in: following }
    }).count();

    if (pageNumber * PER_PAGE_ITEMS >= postsCount + PER_PAGE_ITEMS)
      return res.status(400).json({ error: 'Page does not exist' });

    const posts = await Post.find({ createdBy: { $in: following } })
      .sort(orderSort)
      .skip((pageNumber - 1) * PER_PAGE_ITEMS)
      .limit(PER_PAGE_ITEMS);
    if (!posts) return res.status(404).send('No posts found');

    res.status(200).json({
      success: true,
      posts,
      totalPosts: postsCount,
      nextPage: parseInt(pageNumber, 10) + 1,
      hasNextPage: pageNumber * PER_PAGE_ITEMS < postsCount,
      hasPrevPage: pageNumber > 1
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const updatePost = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (post.createdBy !== req.user.id)
      return res
        .status(401)
        .json({ error: 'You cannot update a post created by another user.' });

    post.title = req.body.title ? req.body.title : post.title;
    post.content = req.body.content ? req.body.content : post.content;
    post.lastUpdated = Date.now();

    const updatedPost = await post.save();
    io.getIO().emit('posts', { message: 'A post updated', updatedPost });

    res.status(200).json({
      success: true,
      msg: 'Post updated successfully',
      updatedPost
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id });
    if (!post) return res.status(404).json({ error: 'Post does not exist' });

    if (post.createdBy !== req.user.id)
      return res.status(401).json({
        error: 'You cannot delete a post created by another user.'
      });

    return res.status(200).json({
      success: true,
      msg: 'Post deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports = {
  getAllPosts,
  createPost,
  getFeed,
  updatePost,
  deletePost
};
