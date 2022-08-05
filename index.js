const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { init } = require('./socket');
require('dotenv').config();

// router imports
const userRouter = require('./routes/users');
const postRouter = require('./routes/posts');

const app = express();

// body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// router middlewares
app.use('/api/users', userRouter);
app.use('/api/posts', postRouter);

// mongoDB connection
mongoose.connect(process.env.MONGO_URI, (err) => {
  if (err) console.log(err);
  else console.log('Connected to DB successfully');
});

const server = app.listen(process.env.PORT, () => {
  console.log(`server running on port ${process.env.PORT}`);
  const io = init(server);
  io.on('connection', () => {
    console.log('New client connected');
  });
});
