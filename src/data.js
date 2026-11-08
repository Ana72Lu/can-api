// Compatibilidade com os serviços existentes: todo o estado fica em memória.
import { store } from './models/store.js';

export const { users, sessions, carts, wishlists, libraries, orders } = store;
