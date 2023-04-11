var jsonwebtoken = require('jsonwebtoken');
var config = require('./../../config/setting.json');

function verifyToken(req, res, next) {

  var token = req.headers['authorization'].split(" ")[1];
  if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
    
  try{
    const decoded = jsonwebtoken.verify(token, config.jwt.secret);
    
    let details = (req.userData = {
      user: decoded.user,
      roles: decoded.roles,
      claims: decoded.claims
    });
    next();
  }
  catch(err){
    return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
  }
}

module.exports = verifyToken;