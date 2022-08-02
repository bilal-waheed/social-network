const express = require('express');
const User = require('../models/User');

const router = express.Router();

//public route
//sign up
router.post('/', (req, res) => {
  User.findOne({ handle: req.body.handle }).then((user) => {
    if (user) {
      res.status(400).json({ error: 'user already exists' });
    }
    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      handle: req.body.handle,
      password: req.body.password,
      followers: [],
      following: []
    });
    newUser
      .save()
      .then((user) => res.json(user))
      .catch((err) => console.log(err));
  });
});

router.get('/all', async (req, res) => {
  const users = await User.find();
  res.send(users);
});

//public route
//sign in
router.post('/sign-in', (req, res) => {
  //check if the user exists
  User.findOne({ handle: req.body.handle }).then((user) => {
    if (!user) return res.json({ error: 'User not found' });

    //compare the password using bcrypt
    // return response
  });
});

//this is a protected route
//follow a user
router.patch('/follow-user/:id', (req, res) => {
  User.findOne({ _id: req.params.id })
    .then((user) => {
      if (!user) return res.json({ error: 'User not found' });
      User.findOne({ _id: req.body.id }).then((user) => {
        user.following.push(req.params.id);
        user
          .save()
          .then((user) => {
            console.log('following done');
          })
          .catch((err) => {
            console.log('following not done.');
          });
      });
      User.findOne({ _id: req.params.id }).then((user) => {
        user.followers.push(req.body.id);
        user
          .save()
          .then((user) => {
            console.log('followers done');
          })
          .catch((err) => {
            console.log('followers not done.');
          });
      });
      res.json();
    })
    .catch((err) => {
      res.json(err);
    });
});

//this is a protected route
//unfollow a user
router.patch('/unfollow-user/:id', (req, res) => {
  User.findOne({ _id: req.params.id })
    .then((user) => {
      if (!user) return res.json({ error: 'User not found' });
      User.findOne({ _id: req.body.id }).then((user) => {
        const indexToRemove = user.following.findIndex(
          (id) => id === req.params.id
        );
        user.following.splice(indexToRemove, 1);
        user
          .save()
          .then((user) => {
            console.log('following done');
          })
          .catch((err) => {
            console.log('following not done.');
          });
      });
      User.findOne({ _id: req.params.id }).then((user) => {
        const indexToRemove = user.followers.findIndex(
          (id) => id === req.body.id
        );
        user.followers.splice(indexToRemove, 1);
        user
          .save()
          .then((user) => {
            console.log('followers done');
          })
          .catch((err) => {
            console.log('followers not done.');
          });
      });
      res.json();
    })
    .catch((err) => {
      res.json(err);
    });
});

//protected route
//update user
router.patch('/update', (req, res) => {
  const user = User.findOne({ handle: req.body.handle }).then((user) => {
    if (!user) return res.json({ error: 'User not found' });
    (user.firstName = req.body.firstName ? req.body.firstName : user.firstName),
      (user.lastName = req.body.lastName ? req.body.lastName : user.lastName),
      (user.handle = req.body.handle ? req.body.handle : user.handle);
    //TODO : password with hash
  });
  user
    .save()
    .then((user) => {
      res.json({ success: true, msg: 'User updated successfully' });
    })
    .catch((err) => {
      res.json(err);
    });
});
//protected route
//delete a user
router.delete('/delete-user', (req, res) => {
  User.findOneAndDelete({ handle: req.body.handle }).then((user) => {
    if (!user) return res.json({ error: 'User does not exist' });
    res.json({ success: true, msg: 'User deleted successfully' });
  });
});

module.exports = router;

// sign up / create x
// sign in o
// update user x
// delete user x
// follow user x
// unfollow user x
