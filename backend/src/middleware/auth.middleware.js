const jwt = require('jsonwebtoken');

function authenticate(req, res, next){
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if(!token) return res.status(401).json({ error: 'missing token' });
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = payload;
    next();
  }catch(e){
    return res.status(401).json({ error: 'invalid token' });
  }
}

module.exports = authenticate;
