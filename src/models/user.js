import { randomUUID } from 'node:crypto';

export function createUser(data, passwordHash) {
  return {
    id: randomUUID(),
    fullName: data.fullName.trim(),
    nickname: data.nickname.trim(),
    birthDate: data.birthDate,
    address: data.address.trim(),
    email: data.email.trim().toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };
}

export function toPublicUser(user) {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...publicData } = user;
  return publicData;
}
