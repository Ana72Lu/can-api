export function createCollectionEntry(game) {
  return {
    gameId: String(game.id),
    addedAt: new Date().toISOString(),
    lastPlayedAt: null,
    // Snapshot interno usado para totalizar pedidos e conceder o jogo à biblioteca.
    // Os controllers não expõem este campo no contrato público da coleção.
    gameSnapshot: structuredClone(game),
  };
}

export function toPublicCollectionEntry(entry) {
  const result = {
    gameId: entry.gameId,
    addedAt: entry.addedAt,
  };
  if (entry.lastPlayedAt) result.lastPlayedAt = entry.lastPlayedAt;
  return result;
}
