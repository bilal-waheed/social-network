const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  dateCreated: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String, // user id / user handle
    required: true
  },
  lastUpdated: {
    type: Date
  }
});

const Post = mongoose.model('posts', PostSchema);
module.exports = Post;
