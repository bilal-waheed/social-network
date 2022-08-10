const Joi = require('joi');

const signUpSchema = Joi.object({
  firstName: Joi.string().min(3).max(30),
  lastName: Joi.string().min(3).max(30),
  username: Joi.string().min(8).max(30),
  email: Joi.string().email(),
  password: Joi.string().min(6).max(15)
});

const loginSchema = Joi.object({
  userName: Joi.string().min(8).max(30),
  password: Joi.string().min(6).max(15)
});

const validateSignUpData = (signUpObject) =>
  signUpSchema.validate(signUpObject);

const validateLoginData = (loginObject) => {
  const { err, value } = loginSchema.validate(loginObject);
  if (err) {
    throw new Error(err);
  }
  return value;
};

module.exports = {
  validateSignUpData,
  validateLoginData
};
