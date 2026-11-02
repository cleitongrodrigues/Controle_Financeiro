const authServiceClient = require('../services/authServiceClient');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não informado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const result = await authServiceClient.verifyToken(token);
    if (!result.valid) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    req.user = result.user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Erro ao verificar token' });
  }
};
