import { carts, wishlists, libraries } from '../data.js';
import { createCollectionEntry } from '../models/collectionEntry.js';
import { HttpError } from '../utils/httpError.js';

const collections = { cart: carts, wishlist: wishlists, library: libraries };

function getCollection(type, userId) {
  const collection = collections[type];
  if (!collection) throw new HttpError(400, 'Coleção inválida.');
  if (!collection.has(userId)) collection.set(userId, []);
  return collection.get(userId);
}

export function listCollection(type, userId) {
  return getCollection(type, userId);
}

export function addToCollection(type, userId, game) {
  if (type === 'library') {
    throw new HttpError(
      403,
      'Jogos só podem entrar na biblioteca após a finalização de uma compra.',
    );
  }
  if (!game?.id || !game?.title) throw new HttpError(400, 'Informe o id e o título do jogo.');
  const collection = getCollection(type, userId);
  const existing = collection.find((entry) => entry.gameId === String(game.id));
  if (existing) return existing;
  const entry = createCollectionEntry(game);
  collection.push(entry);
  return entry;
}

export function removeFromCollection(type, userId, gameId) {
  if (type === 'library') {
    throw new HttpError(403, 'A biblioteca não permite remover jogos por esta operação.');
  }
  const collection = getCollection(type, userId);
  const index = collection.findIndex((entry) => entry.gameId === String(gameId));
  if (index < 0) throw new HttpError(404, 'Jogo não encontrado nesta coleção.');
  return collection.splice(index, 1)[0];
}

export function moveWishlistItem(userId, gameId, position) {
  const collection = getCollection('wishlist', userId);
  const index = collection.findIndex((entry) => entry.gameId === String(gameId));
  if (index < 0) throw new HttpError(404, 'Jogo não encontrado na lista de desejos.');
  const [entry] = collection.splice(index, 1);
  const target = Math.max(0, Math.min(collection.length, Number(position) || 0));
  collection.splice(target, 0, entry);
  return collection;
}

export function markGamePlayed(userId, gameId) {
  const entry = getCollection('library', userId).find((item) => item.gameId === String(gameId));
  if (!entry) throw new HttpError(404, 'Jogo não encontrado na biblioteca.');
  entry.lastPlayedAt = new Date().toISOString();
  return entry;
}

// Único ponto autorizado a inserir itens na biblioteca: conclusão de um pedido.
export function addPurchasedGamesToLibrary(userId, purchasedEntries) {
  const library = getCollection('library', userId);
  for (const cartEntry of purchasedEntries) {
    const alreadyOwned = library.some((entry) => entry.gameId === cartEntry.gameId);
    if (!alreadyOwned) library.push(createCollectionEntry(cartEntry.gameSnapshot));
  }
  return library;
}
