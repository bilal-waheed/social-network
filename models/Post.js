import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date(),
  },
  createdBy: {
    type: String, // user id / user handle
    required: true,
  },
});

module.exports = mongoose.Model("Post", PostSchema);
