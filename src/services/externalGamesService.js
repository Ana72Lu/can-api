import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;
const STEAM_LANGUAGE = 'brazilian';
const STEAM_COUNTRY = 'br';

const GENRE_IDS = new Map([
  ['action', 'action'],
  ['ação', 'action'],
  ['adventure', 'adventure'],
  ['aventura', 'adventure'],
  ['rpg', 'rpg'],
  ['role-playing', 'rpg'],
  ['role-playing game', 'rpg'],
  ['strategy', 'strategy'],
  ['estratégia', 'strategy'],
  ['racing', 'racing'],
  ['corrida', 'racing'],
  ['simulation', 'simulation'],
  ['simulação', 'simulation'],
  ['puzzle', 'puzzle'],
  ['quebra-cabeças', 'puzzle'],
  ['horror', 'horror'],
  ['terror', 'horror'],
]);

const FEATURE_RULES = [
  ['single-player', /single.?player|um jogador/i],
  ['online-multiplayer', /online.?multi.?player|online pvp|online co.?op|massively multiplayer/i],
  ['co-op', /co.?op|cooperativo/i],
  ['achievements', /steam achievements|conquistas/i],
  ['controller-support', /full controller support|partial controller support|controle/i],
  ['cloud-saves', /steam cloud|cloud saves|salvamento na nuvem/i],
];

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(12000),
    headers: { Accept: 'application/json', ...(options.headers || {}) },
  });

  if (!response.ok) {
    throw new HttpError(502, `Serviço externo respondeu com HTTP ${response.status}.`);
  }
  return response.json();
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry || Date.now() - entry.createdAt > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key, value) {
  cache.set(key, { value, createdAt: Date.now() });
  return value;
}

async function getCheapSharkDeals({ page = 0, pageSize = 24, search = '', onSale = true } = {}) {
  const params = new URLSearchParams({
    storeID: '1',
    pageNumber: String(page),
    pageSize: String(pageSize),
    sortBy: 'DealRating',
    onSale: onSale ? '1' : '0',
  });
  if (search) params.set('title', search);

  const cacheKey = `deals:${params.toString()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const deals = await fetchJson(`${env.cheapsharkBaseUrl}/deals?${params}`, {
    headers: { 'User-Agent': env.cheapsharkUserAgent },
  });
  return setCached(cacheKey, deals);
}

async function getSteamAppDetails(appId) {
  if (!appId || !/^\d+$/.test(String(appId))) return null;
  const cacheKey = `steam:${appId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    appids: String(appId),
    cc: STEAM_COUNTRY,
    l: STEAM_LANGUAGE,
  });
  const result = await fetchJson(`${env.steamStoreBaseUrl}/appdetails?${params}`);
  const app = result?.[appId];
  if (!app?.success || !app.data) return null;
  return setCached(cacheKey, app.data);
}

function cleanHtml(value = '') {
  return String(value)
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|h[1-6]|li|div)>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDate(value) {
  if (!value) return '';
  const numeric = /^\d+$/.test(String(value)) ? Number(value) : null;
  const dateValue =
    numeric !== null ? (numeric < 1_000_000_000_000 ? numeric * 1000 : numeric) : value;
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

function mapGenres(steam) {
  const seen = new Set();
  return (steam?.genres || []).flatMap((genre) => {
    const name = String(genre.description || '').trim();
    const id = GENRE_IDS.get(name.toLowerCase());
    if (!id || seen.has(id)) return [];
    seen.add(id);
    return [{ id, name }];
  });
}

function mapPlatforms(steam) {
  const platforms = steam?.platforms || {};
  return [
    platforms.windows ? 'windows' : null,
    platforms.mac ? 'macos' : null,
    platforms.linux ? 'linux' : null,
  ].filter(Boolean);
}

function mapFeatures(steam) {
  const categories = (steam?.categories || []).map((item) => item.description || '');
  const allCategories = categories.join(' ');
  return FEATURE_RULES.filter(([, pattern]) => pattern.test(allCategories)).map(([id]) => id);
}

function mapAccessibilityFeatures(steam) {
  const values = (steam?.categories || []).map((item) => item.description || '');
  return values.filter((value) =>
    /accessib|caption|subtitle|color.?blind|text.?to.?speech|screen.?reader/i.test(value),
  );
}

function mapLanguages(steam) {
  const supported = String(steam?.supported_languages || '');
  if (!supported) return [];

  return supported
    .replace(/<br\s*\/?\s*>/gi, ',')
    .split(',')
    .map((raw) => {
      const hasAudio = /\*/.test(raw);
      const language = cleanHtml(raw).replace(/\*/g, '').trim();
      if (!language) return null;
      return { language, hasInterface: true, hasAudio, hasSubtitles: true };
    })
    .filter(Boolean);
}

function parseRequirementFields(html = '') {
  const text = cleanHtml(html);
  const read = (labels) => {
    for (const label of labels) {
      const pattern = new RegExp(`(?:^|\\n)\\s*${label}\\s*:\\s*([^\\n]+)`, 'i');
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return '';
  };

  return {
    operatingSystem: read(['OS', 'Operating System', 'Sistema operacional']),
    processor: read(['Processor', 'Processador', 'CPU']),
    memory: read(['Memory', 'Memória', 'RAM']),
    graphics: read(['Graphics', 'Gráficos', 'Placa de vídeo']),
    storage: read(['Storage', 'Armazenamento', 'Hard Drive', 'Espaço em disco']),
  };
}

function getRequirementHtml(requirements, kind) {
  if (!requirements) return '';
  if (typeof requirements === 'string') return requirements;
  if (kind === 'minimum') return requirements.minimum || '';
  return requirements.recommended || '';
}

function mapReviewSummary(deal) {
  const positivePercent = numberOrNull(deal?.steamRatingPercent);
  const totalReviews = numberOrNull(deal?.steamRatingCount);
  if (positivePercent === null || totalReviews === null || totalReviews <= 0) return null;
  return { positivePercent, totalReviews };
}

function mapGameSummary(deal, steam) {
  const steamPrice = steam?.price_overview;
  const hasSteamPrice = Boolean(steamPrice && Number.isFinite(Number(steamPrice.final)));
  const cheapSharkDiscount = numberOrNull(deal.savings);
  const steamDiscount = numberOrNull(steamPrice?.discount_percent);
  const steamGenres = (steam?.genres || []).map((item) => item.description).filter(Boolean);
  const categories = (steam?.categories || []).map((item) => item.description).filter(Boolean);
  const isFree = Boolean(steam?.is_free);
  const discountPercent = isFree
    ? 0
    : hasSteamPrice
      ? (steamDiscount ?? 0)
      : cheapSharkDiscount === null
        ? 0
        : Math.round(cheapSharkDiscount);
  const price = isFree
    ? {
        current: 0,
        original: 0,
        currency: 'BRL',
        discountPercent: 0,
        isOnSale: false,
        formattedCurrent: 'Gratuito',
        formattedOriginal: null,
        source: 'steam',
      }
    : hasSteamPrice
      ? {
          current: steamPrice.final / 100,
          original: steamPrice.initial / 100,
          currency: steamPrice.currency,
          discountPercent,
          isOnSale: discountPercent > 0,
          formattedCurrent: steamPrice.final_formatted,
          formattedOriginal: steamPrice.initial_formatted,
          source: 'steam',
        }
      : {
          current: numberOrNull(deal.salePrice),
          original: numberOrNull(deal.normalPrice),
          currency: 'USD',
          discountPercent,
          isOnSale: discountPercent > 0,
          formattedCurrent: null,
          formattedOriginal: null,
          source: 'cheapshark',
        };
  const title = steam?.name || deal.title || '';
  const appId = deal.steamAppID || steam?.steam_appid || null;
  const imageUrl = steam?.header_image || deal.thumb || null;
  const developers = steam?.developers || [];
  const publishers = steam?.publishers || [];

  return {
    id: String(appId || deal.gameID),
    steamAppId: appId ? String(appId) : null,
    slug: String(title || deal.gameID)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
    title,
    shortDescription: steam?.short_description || '',
    developer: developers[0] || '',
    releaseDate: normalizeDate(steam?.release_date?.date || deal.releaseDate),
    genres: mapGenres(steam),
    // Steam Store retorna final em unidade mínima da moeda. Com cc=br, o valor já é centavos de BRL.
    // CheapShark pode retornar USD; nesse caso não inventamos uma conversão cambial para BRL.
    priceInCents: isFree
      ? 0
      : hasSteamPrice && steamPrice.currency === 'BRL'
        ? Number(steamPrice.final)
        : null,
    discountPercent,
    coverImageUrl: imageUrl,
    unitsSold: 0,
    isFeatured: false,
    tags: [...new Set([...steamGenres, ...categories])],
    reviewSummary: mapReviewSummary(deal),
    publisher: publishers[0] || '',
    screenshotUrls: (steam?.screenshots || []).map((item) => item.path_full).filter(Boolean),
    // Mantidos para compatibilidade com clientes que utilizavam o contrato anterior.
    imageUrl,
    thumbnailUrl: deal.thumb || steam?.capsule_image || null,
    price,
    steamUrl: appId ? `https://store.steampowered.com/app/${appId}/` : null,
  };
}

function mapGameDetails(deal, steam) {
  const summary = mapGameSummary(deal, steam);
  const descriptionHtml = steam?.about_the_game || steam?.detailed_description || '';
  const description = cleanHtml(descriptionHtml);
  const minimumHtml = getRequirementHtml(steam?.pc_requirements, 'minimum');
  const recommendedHtml = getRequirementHtml(steam?.pc_requirements, 'recommended');
  const contentDescriptors = (steam?.content_descriptors?.ids || []).map(String);
  const screenshots = (steam?.screenshots || []).map((item) => ({
    id: item.id,
    url: item.path_full,
    thumbnailUrl: item.path_thumbnail,
  }));

  return {
    ...summary,
    aboutSections: description ? [{ title: 'Sobre o jogo', text: description }] : [],
    platforms: mapPlatforms(steam),
    features: mapFeatures(steam),
    accessibilityFeatures: mapAccessibilityFeatures(steam),
    languages: mapLanguages(steam),
    // required_age da Steam não é equivalente à Classificação Indicativa brasileira.
    ageRating: null,
    ageRatingDescriptors: [],
    minimumRequirements: parseRequirementFields(minimumHtml),
    recommendedRequirements: parseRequirementFields(recommendedHtml),
    description,
    descriptionHtml,
    categories: (steam?.categories || []).map((item) => item.description),
    screenshots,
    images: {
      header: steam?.header_image || null,
      capsule: steam?.capsule_image || null,
      capsuleSmall: steam?.capsule_imagev5 || null,
      background: steam?.background || null,
      backgroundRaw: steam?.background_raw || null,
    },
    ageRatingSteam: {
      requiredAge: numberOrNull(steam?.required_age),
      contentDescriptorIds: contentDescriptors,
    },
    reviews: {
      steamRatingText: deal.steamRatingText || null,
      steamRatingPercent: numberOrNull(deal.steamRatingPercent),
      steamRatingCount: numberOrNull(deal.steamRatingCount),
      metacriticScore: numberOrNull(deal.metacriticScore),
      metacriticUrl: deal.metacriticLink || null,
    },
    deal: {
      dealId: deal.dealID || null,
      gameId: deal.gameID || null,
      storeId: deal.storeID || null,
      savingsPercent: numberOrNull(deal.savings),
      redirectUrl: deal.dealID ? `https://www.cheapshark.com/redirect?dealID=${deal.dealID}` : null,
    },
    developers: steam?.developers || [],
    publishers: steam?.publishers || [],
  };
}

async function enrichDeal(deal) {
  try {
    const steam = await getSteamAppDetails(deal.steamAppID);
    return mapGameSummary(deal, steam);
  } catch {
    // A listagem continua disponível se a Steam falhar temporariamente.
    return mapGameSummary(deal, null);
  }
}

export async function listGames(options = {}) {
  const deals = await getCheapSharkDeals(options);
  return Promise.all(deals.map(enrichDeal));
}

export async function getGameByIdOrSlug(identifier) {
  if (/^\d+$/.test(identifier)) {
    const steam = await getSteamAppDetails(identifier);
    if (steam) {
      return mapGameDetails(
        {
          steamAppID: identifier,
          title: steam.name,
          thumb: steam.header_image,
          salePrice: '',
          normalPrice: '',
          savings: '0',
          storeID: '1',
        },
        steam,
      );
    }
  }

  const deals = await getCheapSharkDeals({
    page: 0,
    pageSize: 60,
    search: identifier,
    onSale: false,
  });
  const deal = deals.find(
    (item) =>
      String(item.steamAppID) === identifier ||
      String(item.title).toLowerCase() === identifier.toLowerCase() ||
      String(item.title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') === identifier.toLowerCase(),
  );
  if (!deal) return null;
  try {
    const steam = await getSteamAppDetails(deal.steamAppID);
    return mapGameDetails(deal, steam);
  } catch {
    return mapGameDetails(deal, null);
  }
}
