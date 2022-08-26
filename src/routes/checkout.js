const express = require('express');
const sessionStorage = require('sessionstorage');
const stripe = require('stripe')(
  'sk_test_51LTLK4Bup9Wthw4MXHblIB00CrluZsnyLl92fnnYidmaDs2rqvzFEewgOIxhBWjdFAK9tIhCskq7rDVMMSMOvkxq00StrnoziM'
);
const authenticate = require('../middleware/jwtAuth');

const User = require('../models/User');

const paymentRouter = express.Router();

const checkout = (req, res) => {
  stripe.paymentMethods
    .create({
      type: 'card',
      card: {
        number: '4242424242424242',
        exp_month: 8,
        exp_year: 2023,
        cvc: '314'
      }
    })
    .then((paymentMethod) => {
      stripe.customers
        .create({
          email: req.body.email,
          id: req.user.id,
          source: req.body.stripeToken,
          payment_method: paymentMethod.id
        })
        .then(() =>
          stripe.charges
            .create({
              amount: '50',
              description: 'Feed payment',
              currency: 'usd',
              source: 'tok_visa'
            })
            .then((charge) => {
              User.findOneAndUpdate(
                { _id: req.user.id },
                { $set: { type: 'paid' } }
              ).then((user) => {
                sessionStorage.setItem('user-type', user.type);
                res.status(200).json({
                  success: true,
                  message: 'Payment successful'
                  // charge
                });
              });
            })
            .catch((err) => {
              res.status(500).json({ error: err });
            })
        );
    });
};

paymentRouter.post('/checkout', authenticate, checkout);

module.exports = { paymentRouter, checkout };
