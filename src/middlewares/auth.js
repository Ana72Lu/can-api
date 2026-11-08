import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sessions } from '../data.js';
import { HttpError } from '../utils/httpError.js';

function getToken(req) {
  const authorization = req.headers.authorization || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
}

export function optionalAuth(req, _res, next) {
  const token = getToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, env.jwtSecret);
      if (sessions.has(token)) req.userId = payload.sub;
    } catch {
      // Acesso visitante: token ausente ou inválido não autentica o usuário.
    }
  }
  req.userId ||= 'guest';
  next();
}

export function requireAuth(req, _res, next) {
  const token = getToken(req);
  if (!token) return next(new HttpError(401, 'Faça login para realizar esta operação.'));
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (!sessions.has(token)) throw new Error('Sessão encerrada.');
    req.userId = payload.sub;
    return next();
  } catch {
    return next(new HttpError(401, 'Sessão inválida ou expirada. Entre novamente.'));
  }
}

export function getBearerToken(req) {
  return getToken(req);
}
