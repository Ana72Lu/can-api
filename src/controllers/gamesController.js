import { listGames, getGameByIdOrSlug } from '../services/externalGamesService.js';
import { HttpError } from '../utils/httpError.js';

export async function getGames(req, res) {
  const page = Math.max(0, Number.parseInt(req.query.page, 10) || 0);
  const limit = Math.min(60, Math.max(1, Number.parseInt(req.query.limit, 10) || 24));
  const search = String(req.query.search || '').trim();
  const onSale = req.query.onSale === undefined ? true : req.query.onSale !== 'false';
  let games = await listGames({ page, pageSize: limit, search, onSale });
  if (req.query.genre) {
    const genre = String(req.query.genre).toLowerCase();
    games = games.filter((game) => game.genres.some((item) => item.id === genre));
  }
  if (req.query.sort === 'price-asc')
    games.sort((a, b) => (a.priceInCents ?? Infinity) - (b.priceInCents ?? Infinity));
  if (req.query.sort === 'discount-desc')
    games.sort((a, b) => b.price.discountPercent - a.price.discountPercent);
  res.json({
    data: games,
    pagination: { page, limit, count: games.length },
    source: ['CheapShark', 'Steam Store'],
  });
}

export async function getGame(req, res) {
  const game = await getGameByIdOrSlug(req.params.identifier);
  if (!game) throw new HttpError(404, 'Jogo não encontrado nas fontes consultadas.');
  res.json({ data: game, source: ['CheapShark', 'Steam Store'] });
}
