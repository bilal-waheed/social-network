const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sessionStorage = require('sessionstorage');
const mongoose = require('mongoose');

const User = require('../models/User');
const Post = require('../models/Post');
const { validateSignUpData, validateLoginData } = require('../validation/joi');

const userSignUp = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user) return res.status(400).json({ error: 'user already exists' });

    const { firstName, lastName, username, email, password } = req.body;

    const { value, error } = validateSignUpData({
      firstName,
      lastName,
      username,
      email,
      password
    });

    if (error) return res.status(400).json(error.details[0].message);

    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      password,
      followers: [],
      following: [],
      type: req.body.type ? req.body.type : 'unpaid'
    });

    // Hashing the password
    bcrypt.genSalt(10, (err, salt) => {
      if (err) throw err;

      bcrypt.hash(password, salt, async (error, hash) => {
        if (error) throw error;

        newUser.password = hash;

        const userObj = await newUser.save();

        sessionStorage.setItem('user-type', userObj.type);

        const token = jwt.sign(
          { id: userObj.id, userType: 'user' },
          process.env.SECRET_OR_PRIVATE_KEY,
          { expiresIn: '24h' }
        );

        res.status(201).json({
          success: true,
          msg: 'sign up successful',
          userObj,
          token
        });
      });
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const userLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const { value, error } = validateLoginData({ username, password });
    if (error) return res.status(400).json(error.details[0].message);

    // check if the user exists
    const user = await User.findOne({ username: value.username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Comparing the password
    const isMatched = await bcrypt.compare(value.password, user.password);

    if (isMatched) {
      const token = jwt.sign(
        { id: user.id, userType: 'user' },
        process.env.SECRET_OR_PRIVATE_KEY,
        { expiresIn: '7d' }
      );

      sessionStorage.setItem('user-type', user.type);

      res
        .status(200)
        .json({ success: true, msg: 'login successful', user, token });
    } else {
      res.status(400).json({ error: 'password incorrect' });
    }
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const userProfile = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.id });
    res.status(200).json({
      success: true,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        type: user.type,
        followers: user.followers,
        following: user.following
      }
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const userUpdate = async (req, res) => {
  try {
    // if (!req.user.id)
    //   return res.status(401).json({
    //     error: 'Unauthorized.'
    //   });

    const user = await User.findOne({ _id: req.user.id });
    const { value, error } = validateSignUpData(req.body);

    if (error) return res.status(400).json(error.details[0].message);

    user.firstName = value.firstName ? value.firstName : user.firstName;
    user.lastName = value.lastName ? value.lastName : user.lastName;
    user.username = value.username ? value.username : user.username;
    user.email = value.email ? value.email : user.email;

    // re creating a hash for updated password
    if (value.password) {
      bcrypt.genSalt(10, (err, salt) => {
        if (err) throw err;

        bcrypt.hash(value.password, salt, (error, hash) => {
          if (error) throw error;

          user.password = hash;
        });
      });
    }

    const updatedUser = await user.save();
    res.status(200).json({
      success: true,
      msg: 'User updated successfully',
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const userDelete = async (req, res) => {
  try {
    // if (!req.user.id)
    //   return res.status(401).json({
    //     error: 'Unauthorized.'
    //   });

    const user = await User.findOneAndDelete({ _id: req.user.id });
    if (!user) return res.status(404).json({ error: 'User does not exist' });

    const result = await Post.deleteMany({ createdBy: req.user.id });

    return res.status(200).json({
      success: true,
      msg: 'User deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const userFollow = async (req, res) => {
  try {
    const userToFollow = await User.findOne({ _id: req.params.id });

    if (!userToFollow) return res.status(404).json({ error: 'User not found' });

    const user = await User.findOne({ _id: req.user.id });

    if (user.following.includes(req.params.id))
      return res.json({ error: 'User already followed' });

    user.following.push(req.params.id);

    await user.save();

    userToFollow.followers.push(req.user.id);

    await userToFollow.save();

    res.status(200).json({
      success: true,
      msg: 'User followed successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const userUnfollow = async (req, res) => {
  try {
    const userToUnfollow = await User.findOne({ _id: req.params.id });

    if (!userToUnfollow) res.status(404).json({ error: 'User not found' });

    const user = await User.findOne({ _id: req.user.id });

    const indexOfUserFollowing = user.following.findIndex(
      (id) => id === req.params.id
    );

    if (indexOfUserFollowing === -1)
      return res.status(404).json({ error: 'User not followed' });

    user.following.splice(indexOfUserFollowing, 1);

    await user.save();

    const indexToRemove = userToUnfollow.followers.findIndex(
      (id) => id === req.user.id
    );

    userToUnfollow.followers.splice(indexToRemove, 1);

    await userToUnfollow.save();

    res.status(200).json({
      success: true,
      msg: 'User unfollowed successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports = {
  userSignUp,
  userLogin,
  userProfile,
  userUpdate,
  userDelete,
  userFollow,
  userUnfollow
};
