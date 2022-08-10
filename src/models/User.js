const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  followers: {
    type: Array
  },
  following: {
    type: Array
  },
  type: {
    type: String,
    required: true
  }
});

const User = mongoose.model('users', UserSchema);
module.exports = User;
