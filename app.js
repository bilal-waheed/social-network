const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { init } = require('./src/socketio/socket');
require('dotenv').config();

// router imports
const userRouter = require('./src/routes/users');
const postRouter = require('./src/routes/posts');
const { paymentRouter } = require('./src/routes/checkout');
const moderatorRouter = require('./src/routes/moderator');

const app = express();

// body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// router middlewares
app.use('/api/users', userRouter);
app.use('/api/posts', postRouter);
app.use('/api/moderators', moderatorRouter);
app.use('/', paymentRouter);

app.get('*', (req, res) => {
  res.status(404).send('Oops! Page does not exist');
});

// mongoDB connection
if (process.env.NODE_ENV === 'dev') {
  mongoose.connect(process.env.MONGO_URI, (err) => {
    if (err) console.log(err);
    else console.log('Connected to DB successfully');
  });
}

const server = app.listen(process.env.PORT, () => {
  console.log(`server running on port ${process.env.PORT}`);
  const io = init(server);
  io.on('connection', () => {
    console.log('New client connected');
  });
});

module.exports = { app };
