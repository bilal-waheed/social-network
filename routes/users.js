const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.post("/", (req, res) => {
  User.findOne({ handle: req.body.handle }).then((user) => {
    if (user) {
      res.status(400).json({ error: "user already exists" });
    }
    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      handle: req.body.handle,
      password: req.body.password,
      followers: [],
      following: [],
    });
    newUser
      .save()
      .then((user) => res.json(user))
      .catch((err) => console.log(err));
  });
});

router.get("/all", async (req, res) => {
  const users = await User.find();
  res.send(users);
});

//this is a protected route
router.patch("/follow-user/:id", (req, res) => {
  User.findOne({ _id: req.params.id })
    .then((user) => {
      if (!user) return res.json({ error: "User not found" });
      User.findOne({ _id: req.body.id }).then((user) => {
        user.following.push(req.params.id);
        user
          .save()
          .then((user) => {
            console.log("following done");
          })
          .catch((err) => {
            console.log("following not done.");
          });
      });
      User.findOne({ _id: req.params.id }).then((user) => {
        user.followers.push(req.body.id);
        user
          .save()
          .then((user) => {
            console.log("followers done");
          })
          .catch((err) => {
            console.log("followers not done.");
          });
      });
      res.json();
    })
    .catch((err) => {
      res.json(err);
    });
});

//this is a protected route
router.patch("/unfollow-user/:id", (req, res) => {
  User.findOne({ _id: req.params.id })
    .then((user) => {
      if (!user) return res.json({ error: "User not found" });
      User.findOne({ _id: req.body.id }).then((user) => {
        const indexToRemove = user.following.findIndex(
          (id) => id === req.params.id
        );
        user.following.splice(indexToRemove, 1);
        user
          .save()
          .then((user) => {
            console.log("following done");
          })
          .catch((err) => {
            console.log("following not done.");
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
            console.log("followers done");
          })
          .catch((err) => {
            console.log("followers not done.");
          });
      });
      res.json();
    })
    .catch((err) => {
      res.json(err);
    });
});

module.exports = router;

// sign up / create
// sign in
// update user
// delete user
// follow user
// unfollow user
