const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { validateSignUpData, validateLoginData } = require('../validation/joi');
const Post = require('../models/Post');
const Moderator = require('../models/Moderator');

const moderatorSignup = async (req, res) => {
  try {
    const mod = await Moderator.findOne({ username: req.body.username });
    if (mod) return res.status(400).json({ error: 'moderator already exists' });

    const { firstName, lastName, username, email, password } = req.body;

    const { value, error } = validateSignUpData({
      firstName,
      lastName,
      username,
      email,
      password
    });
    if (error) return res.status(400).json(error.details[0].message);

    const newMod = new Moderator({
      firstName,
      lastName,
      username,
      email,
      password
    });

    // Hashing the password
    bcrypt.genSalt(10, (err, salt) => {
      if (err) throw err;
      bcrypt.hash(password, salt, async (error, hash) => {
        if (error) throw error;

        newMod.password = hash;

        const modObj = await newMod.save();

        const token = jwt.sign(
          { id: modObj.id, userType: 'moderator' },
          process.env.SECRET_OR_PRIVATE_KEY,
          { expiresIn: '24h' }
        );

        res.status(201).json({
          success: true,
          msg: 'sign up successful',
          modObj,
          token
        });
      });
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const moderatorLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const { value, error } = validateLoginData({ username, password });
    if (error) return res.status(400).json(error.details[0].message);

    // check if the moderator exists
    const mod = await Moderator.findOne({ username: req.body.username });
    if (!mod) return res.status(404).json({ error: 'Moderator not found' });

    // Comparing the password
    const isMatched = await bcrypt.compare(value.password, mod.password);

    if (isMatched) {
      const token = jwt.sign(
        { id: mod.id, userType: 'mod' },
        process.env.SECRET_OR_PRIVATE_KEY,
        { expiresIn: '7d' }
      );

      res
        .status(200)
        .json({ success: true, msg: 'login successful', mod, token });
    } else {
      res.status(400).json({ error: 'password incorrect' });
    }
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const PER_PAGE_ITEMS = 4;
const getPosts = async (req, res) => {
  try {
    const { param, order, pageNumber } = req.body;

    if (!(param && order && pageNumber))
      return res.status(400).json({ error: 'Query parameters required.' });

    const orderSort = {};
    orderSort[param] = order;

    const postsCount = await Post.find().count();

    if (pageNumber * PER_PAGE_ITEMS >= postsCount + PER_PAGE_ITEMS)
      return res.status(400).json({ error: 'Page does not exist' });

    const posts = await Post.find()
      .sort(orderSort)
      .skip((pageNumber - 1) * PER_PAGE_ITEMS)
      .limit(PER_PAGE_ITEMS);

    if (!posts) return res.status(404).send('No posts found');

    const mappedPosts = posts.map((post) => ({
      _id: post.id,
      title: post.title,
      content: post.content,
      dateCreated: post.dateCreated
    }));

    res.status(200).json({
      success: true,
      mappedPosts,
      totalPosts: postsCount,
      nextPage: parseInt(pageNumber, 10) + 1,
      hasNextPage: pageNumber * PER_PAGE_ITEMS < postsCount,
      hasPrevPage: pageNumber > 1
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports = {
  moderatorSignup,
  moderatorLogin,
  getPosts
};
