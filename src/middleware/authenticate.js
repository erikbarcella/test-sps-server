const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  let token = (req.headers["authorization"] || '').replace('Bearer ','');
  if (!token) return res.status(401).send('Token não fornecido.');

  jwt.verify(token, 'mySecret', (err, user) => {
    if (err) return res.status(403).send('Token inválido.');
    req.user = user;
    next();
  });
}

module.exports = authenticate;
