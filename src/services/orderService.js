import { orders, carts, wishlists } from '../data.js';
import { createOrder } from '../models/order.js';
import { addPurchasedGamesToLibrary } from './collectionService.js';
import { HttpError } from '../utils/httpError.js';

const PAYMENT_METHODS = new Set(['credit-card', 'debit-card', 'boleto', 'pix', 'bank-deposit']);

export function placeOrder(userId, request = {}) {
  const cart = carts.get(userId) || [];
  if (!cart.length) throw new HttpError(400, 'Seu carrinho está vazio.');

  const { gameIds, paymentMethod } = request;
  if (!Array.isArray(gameIds) || gameIds.length === 0) {
    throw new HttpError(400, 'Informe os identificadores dos jogos do pedido.', {
      gameIds: 'Selecione ao menos um jogo.',
    });
  }
  if (!PAYMENT_METHODS.has(paymentMethod)) {
    throw new HttpError(400, 'Método de pagamento inválido.', {
      paymentMethod: 'Selecione uma forma de pagamento válida.',
    });
  }

  const cartIds = cart.map((entry) => entry.gameId).sort();
  const requestedIds = gameIds.map(String).sort();
  if (
    new Set(requestedIds).size !== requestedIds.length ||
    cartIds.length !== requestedIds.length ||
    cartIds.some((id, index) => id !== requestedIds[index])
  ) {
    throw new HttpError(
      400,
      'Os jogos informados não correspondem aos itens do carrinho. Atualize o carrinho antes de finalizar.',
    );
  }

  const pricesInCents = cart.map((entry) => Number(entry.gameSnapshot.priceInCents));
  if (
    cart.some(
      (entry) =>
        entry.gameSnapshot.priceInCents === null ||
        entry.gameSnapshot.priceInCents === undefined ||
        !Number.isInteger(Number(entry.gameSnapshot.priceInCents)) ||
        Number(entry.gameSnapshot.priceInCents) < 0,
    )
  ) {
    throw new HttpError(
      400,
      'Um ou mais jogos não possuem preço válido em centavos de BRL. Atualize os itens do carrinho.',
    );
  }
  const totalInCents = pricesInCents.reduce((sum, cents) => sum + cents, 0);
  const currency = 'BRL';

  const order = createOrder(userId, cart, totalInCents / 100, currency, paymentMethod);
  addPurchasedGamesToLibrary(userId, cart);

  const purchasedIds = new Set(cart.map((entry) => entry.gameId));
  const wishlist = wishlists.get(userId) || [];
  wishlists.set(
    userId,
    wishlist.filter((entry) => !purchasedIds.has(entry.gameId)),
  );
  carts.set(userId, []);
  orders.push(order);
  return order;
}

export function listOrders(userId) {
  return orders.filter((order) => order.userId === userId);
}
