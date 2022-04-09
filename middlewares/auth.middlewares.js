const jwt = require('jsonwebtoken');

const authorization = (req, res, next) => {
  const token = req.get('Authorization');

  if (!token) {
    return res.status(401).json({ msg: 'Request without token' });
  }

  const tokenWithoutBearer = token.split(' ')[1];

  try {
    const decodedToken = jwt.verify(tokenWithoutBearer, process.env.SECRET_JWT);
    req.user = { ...decodedToken };
    next();
  } catch (error) {
    res.status(401).json({ msg: 'Unauthorized', error: error.message });
  }
};

module.exports = authorization;
