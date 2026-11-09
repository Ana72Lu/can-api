import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cheapsharkBaseUrl: process.env.CHEAPSHARK_BASE_URL || 'https://www.cheapshark.com/api/1.0',
  steamStoreBaseUrl: process.env.STEAM_STORE_BASE_URL || 'https://store.steampowered.com/api',
  cheapsharkUserAgent: process.env.CHEAPSHARK_USER_AGENT || 'CanGamesAPI/1.0',
};

if (env.nodeEnv === 'production' && env.jwtSecret === 'development-only-change-me') {
  throw new Error('Defina JWT_SECRET no ambiente de produção.');
}
