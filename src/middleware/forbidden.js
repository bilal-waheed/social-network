const checkForbidden = (req, res, next) => {
  if (req.user.userType === 'user') return res.status(403).send('Forbidden');
  return next();
};

module.exports = checkForbidden;
