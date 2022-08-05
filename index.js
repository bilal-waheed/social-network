const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

// router imports
const userRouter = require('./routes/users');

const app = express();

// body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// router middlewares
app.use('/api/users', userRouter);

// mongoDB connection
mongoose.connect(process.env.MONGO_URI, (err) => {
  if (err) console.log(err);
  else console.log('Connected to DB successfully');
});

app.listen(process.env.PORT, () => {
  console.log('server running on port 3000');
});
