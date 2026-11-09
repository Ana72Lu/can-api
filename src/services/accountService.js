import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { users, sessions, carts, wishlists, libraries, orders } from '../data.js';
import { createUser, toPublicUser } from '../models/user.js';
import { HttpError } from '../utils/httpError.js';

export function validateRegistration(input = {}) {
  const errors = {};
  const requiredFields = ['fullName', 'nickname', 'birthDate', 'address', 'email', 'password'];
  for (const field of requiredFields) {
    if (!String(input[field] ?? '').trim()) errors[field] = 'Este campo é obrigatório.';
  }
  if (input.fullName && input.fullName.trim().length < 3)
    errors.fullName = 'Informe seu nome completo.';
  if (input.nickname && !/^[a-zA-Z0-9_]{3,20}$/.test(input.nickname))
    errors.nickname = 'Use de 3 a 20 caracteres: letras, números ou sublinhado.';
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
    errors.email = 'Informe um e-mail válido.';
  if (input.password && !/(?=.*[A-Za-z])(?=.*\d).{8,}/.test(input.password))
    errors.password = 'Use pelo menos 8 caracteres, incluindo letras e números.';
  if (input.birthDate) {
    const birthDate = new Date(`${input.birthDate}T00:00:00`);
    if (
      Number.isNaN(birthDate.getTime()) ||
      birthDate > new Date(Date.now() - 13 * 365.25 * 24 * 60 * 60 * 1000)
    ) {
      errors.birthDate = 'Informe uma data válida. É necessário ter pelo menos 13 anos.';
    }
  }
  return errors;
}

export async function registerUser(input) {
  const errors = validateRegistration(input);
  if (Object.keys(errors).length)
    throw new HttpError(400, 'Verifique os campos do formulário.', errors);
  if (users.some((user) => user.email === input.email.trim().toLowerCase()))
    throw new HttpError(409, 'Este e-mail já está cadastrado.', { email: 'Utilize outro e-mail.' });
  if (users.some((user) => user.nickname.toLowerCase() === input.nickname.trim().toLowerCase()))
    throw new HttpError(409, 'Este apelido já está em uso.', {
      nickname: 'Escolha outro apelido.',
    });
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = createUser(input, passwordHash);
  users.push(user);
  return toPublicUser(user);
}

export async function createSession(email, password) {
  const user = users.find(
    (item) =>
      item.email ===
      String(email || '')
        .trim()
        .toLowerCase(),
  );
  if (!user || !(await bcrypt.compare(String(password || ''), user.passwordHash)))
    throw new HttpError(401, 'E-mail ou senha incorretos.');
  const token = jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  sessions.set(token, { userId: user.id, createdAt: Date.now() });
  return { token, user: toPublicUser(user) };
}

export function endSession(token) {
  if (token) sessions.delete(token);
}

export function getUserById(userId) {
  const user = users.find((item) => item.id === userId);
  if (!user) throw new HttpError(404, 'Usuário não encontrado.');
  return user;
}

export function updateUser(userId, changes) {
  const user = getUserById(userId);
  const allowed = ['fullName', 'nickname', 'address', 'email'];
  if (
    changes.email &&
    users.some((item) => item.id !== userId && item.email === changes.email.trim().toLowerCase())
  )
    throw new HttpError(409, 'Este e-mail já está cadastrado.', { email: 'Utilize outro e-mail.' });
  if (
    changes.nickname &&
    users.some(
      (item) =>
        item.id !== userId && item.nickname.toLowerCase() === changes.nickname.trim().toLowerCase(),
    )
  )
    throw new HttpError(409, 'Este apelido já está em uso.', {
      nickname: 'Escolha outro apelido.',
    });
  for (const field of allowed)
    if (changes[field] !== undefined)
      user[field] =
        field === 'email'
          ? String(changes[field]).trim().toLowerCase()
          : String(changes[field]).trim();
  return toPublicUser(user);
}

export function deleteUser(userId) {
  const index = users.findIndex((user) => user.id === userId);
  if (index < 0) throw new HttpError(404, 'Usuário não encontrado.');
  users.splice(index, 1);
  for (const [token, session] of sessions) if (session.userId === userId) sessions.delete(token);
  carts.delete(userId);
  wishlists.delete(userId);
  libraries.delete(userId);
  for (let orderIndex = orders.length - 1; orderIndex >= 0; orderIndex -= 1) {
    if (orders[orderIndex].userId === userId) orders.splice(orderIndex, 1);
  }
}

export { toPublicUser };
