// Armazenamento temporário em memória. Os dados são perdidos quando o processo reinicia.
export const store = {
  users: [],
  sessions: new Map(),
  carts: new Map(),
  wishlists: new Map(),
  libraries: new Map(),
  orders: [],
};
