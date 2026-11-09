import { createSession, endSession } from '../services/accountService.js';
import { getBearerToken } from '../middlewares/auth.js';

export async function login(req, res) {
  const result = await createSession(req.body.email, req.body.password);
  res.json({ data: result });
}

export function logout(req, res) {
  endSession(getBearerToken(req));
  res.status(204).send();
}
