const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.body.token || req.query.token || req.headers.token;

  if (!token)
    return res
      .status(403)
      .send('Access denied. A token is required for authentication.');

  try {
    const verified = jwt.verify(token, process.env.SECRET_OR_PRIVATE_KEY);
    req.user = verified;
  } catch (err) {
    return res.status(401).send('Invalid token');
  }
  return next();
};

module.exports = authenticate;
