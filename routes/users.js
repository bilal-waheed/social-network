const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sessionStorage = require('sessionstorage');
const authenticate = require('../middleware/jwtAuth');

const User = require('../models/User');
const Post = require('../models/Post');

const { validateSignUpData, validateLoginData } = require('../validation/joi');

const router = express.Router();

// public route
// sign up
router.post('/signup', (req, res) => {
  User.findOne({ username: req.body.username }).then((user) => {
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
      type: 'unpaid'
    });

    // Hashing the password
    bcrypt.genSalt(10, (err, salt) => {
      if (err) throw err;
      bcrypt.hash(password, salt, (error, hash) => {
        if (error) throw error;
        newUser.password = hash;

        newUser
          .save()
          .then((userObj) => {
            const token = jwt.sign(
              { id: userObj.id },
              process.env.SECRET_OR_PRIVATE_KEY,
              { expiresIn: '24h' }
            );
            res.status(201).json({
              success: true,
              msg: 'sign up successful',
              userObj,
              token
            });
          })
          .catch((userErr) => res.status(500).json(userErr));
      });
    });
  });
});

// public route
// log in
router.post('/login', (req, res) => {
  // check if the user exists
  User.findOne({ username: req.body.username }).then((user) => {
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { username, password } = req.body;

    const { value, error } = validateLoginData({ username, password });
    if (error) return res.status(400).json(error.details[0].message);

    // Comparing the password
    bcrypt.compare(password, user.password).then((isMatched) => {
      if (isMatched) {
        const token = jwt.sign(
          { id: user.id },
          process.env.SECRET_OR_PRIVATE_KEY,
          { expiresIn: '24h' }
        );
        sessionStorage.setItem('user-type', user.type);
        res
          .status(200)
          .json({ success: true, msg: 'login successful', user, token });
      } else {
        res.status(400).json({ error: 'password incorrect' });
      }
    });
  });
});

// protected route
// update user
router.patch('/update/:id', authenticate, (req, res) => {
  User.findOne({ _id: req.user.id })
    .then((user) => {
      if (!user)
        return res
          .status(404)
          .json({ error: 'User not found! Id is required' });

      console.log(user.id, req.user.id);
      if (user.id !== req.user.id)
        return res.status(401).json({
          error: 'Unauthorized.'
        });

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

      user
        .save()
        .then((updatedUser) =>
          res.status(200).json({
            success: true,
            msg: 'User updated successfully',
            user: updatedUser
          })
        )
        .catch((err) => {
          res.json({ error: err });
        });
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
});

// protected route
// delete a user
router.delete('/delete/:id', authenticate, (req, res) => {
  User.findOneAndDelete({ _id: req.user.id })
    .then(async (user) => {
      if (!user) return res.status(404).json({ error: 'User does not exist' });

      if (user.id !== req.user.id)
        return res.status(401).json({
          error: 'Unauthorized.'
        });

      try {
        const result = await Post.deleteMany({ createdBy: req.user.id });

        return res.status(200).json({
          success: true,
          msg: 'User deleted successfully'
        });
      } catch (err) {
        throw new Error(err);
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
});

// this is a protected route
// follow a user
router.patch('/follow-user/:id', authenticate, (req, res) => {
  User.findOne({ _id: req.params.id })
    .then((userToFollow) => {
      if (!userToFollow)
        return res.status(404).json({ error: 'User not found' });

      User.findOne({ _id: req.user.id }).then((user) => {
        if (user.following.includes(req.params.id))
          return res.json({ error: 'User already followed' });

        user.following.push(req.params.id);
        user
          .save()
          .then(() => {
            User.findOne({ _id: req.params.id }).then((user) => {
              user.followers.push(req.user.id);
              user
                .save()
                .then(() => {
                  res.status(200).json({
                    success: true,
                    msg: 'User followed successfully'
                  });
                })
                .catch((err) => {
                  res.status(500).json({ err });
                });
            });
          })
          .catch((err) => {
            res.status(500).json({ err });
          });
      });
    })
    .catch((err) => {
      res.status(500).json(err);
    });
});

// this is a protected route
// unfollow a user
router.patch('/unfollow-user/:id', authenticate, (req, res) => {
  User.findOne({ _id: req.params.id })
    .then((userToUnfollow) => {
      if (!userToUnfollow) res.status(404).json({ error: 'User not found' });

      User.findOne({ _id: req.user.id }).then((user) => {
        const indexOfUserFollowing = user.following.findIndex(
          (id) => id === req.params.id
        );

        if (indexOfUserFollowing === -1)
          return res.status(404).json({ error: 'User not followed' });

        user.following.splice(indexOfUserFollowing, 1);
        user
          .save()
          .then(() => {
            User.findOne({ _id: req.params.id }).then((user) => {
              const indexToRemove = user.followers.findIndex(
                (id) => id === req.user.id
              );
              user.followers.splice(indexToRemove, 1);
              user
                .save()
                .then(() => {
                  res.status(200).json({
                    success: true,
                    msg: 'User unfollowed successfully'
                  });
                })
                .catch((err) => {
                  res.status(500).json({ error: err });
                });
            });
          })
          .catch((err) => {
            res.status(500).json({ error: err });
          });
      });
    })
    .catch((err) => {
      res.json(err);
    });
});

module.exports = router;
