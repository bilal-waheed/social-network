const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/jwtAuth');

const User = require('../models/User');

const router = express.Router();

// public route
// sign up
router.post('/', (req, res) => {
  User.findOne({ handle: req.body.handle }).then((user) => {
    if (user) return res.status(400).json({ error: 'user already exists' });

    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      handle: req.body.handle,
      password: req.body.password,
      followers: [],
      following: []
    });

    // Hashing the password
    bcrypt.genSalt(10, (err, salt) => {
      if (err) throw err;
      bcrypt.hash(newUser.password, salt, (error, hash) => {
        if (error) throw error;
        newUser.password = hash;

        newUser
          .save()
          .then((userObj) => res.json(userObj))
          .catch((userErr) => res.json(userErr));
      });
    });
  });
});

// test route
// get all users
router.get('/all', async (req, res) => {
  const users = await User.find();
  res.send(users);
});

// public route
// sign in
router.post('/sign-in', (req, res) => {
  // check if the user exists
  User.findOne({ handle: req.body.handle }).then((user) => {
    if (!user) return res.json({ error: 'User not found' });
    // Comparing the password
    bcrypt.compare(req.body.password, user.password).then((isMatched) => {
      if (isMatched) {
        const token = jwt.sign(
          { id: user.id },
          process.env.SECRET_OR_PRIVATE_KEY,
          { expiresIn: '24h' }
        );
        res.json({ success: true, msg: 'login successful', user, token });
      } else {
        res.json({ error: 'password incorrect' });
      }
    });
  });
});

// this is a protected route
// follow a user
router.patch('/follow-user/:id', authenticate, (req, res) => {
  User.findOne({ _id: req.params.id })
    .then((userToFollow) => {
      if (!userToFollow) return res.json({ error: 'User not found' });
      User.findOne({ _id: req.body.id }).then((user) => {
        if (user.following.includes(req.params.id))
          return res.json({ err: 'User already followed' });
        user.following.push(req.params.id);
        user
          .save()
          .then(() => {
            User.findOne({ _id: req.params.id }).then((user) => {
              user.followers.push(req.body.id);
              user
                .save()
                .then(() => {
                  res.json({
                    success: true,
                    msg: 'User followed successfully'
                  });
                })
                .catch((err) => {
                  res.json({ err });
                });
            });
          })
          .catch((err) => {
            res.json({ err });
          });
      });
    })
    .catch((err) => {
      res.json(err);
    });
});

// this is a protected route
// unfollow a user
router.patch('/unfollow-user/:id', authenticate, (req, res) => {
  User.findOne({ _id: req.params.id })
    .then((userToUnfollow) => {
      if (!userToUnfollow) res.json({ error: 'User not found' });
      User.findOne({ _id: req.body.id }).then((user) => {
        const indexOfUserFollowing = user.following.findIndex(
          (id) => id === req.params.id
        );
        if (indexOfUserFollowing === -1)
          return res.json({ err: 'User not followed' });
        user.following.splice(indexOfUserFollowing, 1);
        user
          .save()
          .then(() => {
            User.findOne({ _id: req.params.id }).then((user) => {
              const indexToRemove = user.followers.findIndex(
                (id) => id === req.body.id
              );
              user.followers.splice(indexToRemove, 1);
              user
                .save()
                .then(() => {
                  res.json({
                    success: true,
                    msg: 'User unfollowed successfully'
                  });
                })
                .catch((err) => {
                  res.json({ err });
                });
            });
          })
          .catch((err) => {
            res.json({ err });
          });
      });
    })
    .catch((err) => {
      res.json(err);
    });
});

// protected route
// update user
router.patch('/update', (req, res) => {
  User.findOne({ handle: req.body.handle })
    .then((user) => {
      if (!user) res.json({ error: 'User not found' });
      user.firstName = req.body.firstName ? req.body.firstName : user.firstName;
      user.lastName = req.body.lastName ? req.body.lastName : user.lastName;
      user.handle = req.body.handle ? req.body.handle : user.handle;
      // TODO : password with hash
      user
        .save()
        .then(() =>
          res.json({
            success: true,
            msg: 'User updated successfully'
          })
        )
        .catch((err) => {
          res.json(err);
        });
    })
    .catch(() => {});
});

// protected route
// delete a user
router.delete('/delete-user', (req, res) => {
  User.findOneAndDelete({ handle: req.body.handle }).then((user) => {
    if (!user) return res.json({ error: 'User does not exist' });
    return res.json({
      success: true,
      msg: 'User deleted successfully'
    });
  });
});

module.exports = router;
