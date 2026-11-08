import {
  registerUser,
  getUserById,
  updateUser,
  deleteUser,
  toPublicUser,
} from '../services/accountService.js';
import { HttpError } from '../utils/httpError.js';

export async function createUser(req, res) {
  const user = await registerUser(req.body);
  res.status(201).json({ data: user, message: 'Conta criada com sucesso.' });
}

export function getCurrentUser(req, res) {
  res.json({ data: toPublicUser(getUserById(req.userId)) });
}

export function updateCurrentUser(req, res) {
  if (req.params.id !== req.userId)
    throw new HttpError(403, 'Você só pode alterar sua própria conta.');
  const changes = { ...req.body };
  delete changes.password;
  delete changes.passwordHash;
  res.json({ data: updateUser(req.userId, changes), message: 'Perfil atualizado.' });
}

export function removeCurrentUser(req, res) {
  if (req.params.id !== req.userId)
    throw new HttpError(403, 'Você só pode excluir sua própria conta.');
  deleteUser(req.userId);
  res.status(204).send();
}
