import { randomUUID } from 'node:crypto';

export function createOrder(userId, items, total, currency, paymentMethod) {
  return {
    id: `CAN-${randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`,
    gameIds: items.map((item) => item.gameId),
    paymentMethod,
    createdAt: new Date().toISOString(),
    userId,
    items: items.map(({ gameSnapshot, ...entry }) => ({
      ...entry,
      game: structuredClone(gameSnapshot),
    })),
    total: Number(total.toFixed(2)),
    currency,
    status: 'approved',
    paymentNote: 'Pedido acadêmico simulado; nenhum pagamento real foi realizado.',
  };
}
