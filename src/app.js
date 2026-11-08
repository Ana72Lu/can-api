import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import gamesRoutes from './routes/gamesRoutes.js';
import collectionsRoutes from './routes/collectionsRoutes.js';
import usersRoutes from './routes/usersRoutes.js';
import sessionsRoutes from './routes/sessionsRoutes.js';
import ordersRoutes from './routes/ordersRoutes.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: env.frontendOrigin.split(',').map((origin) => origin.trim()),
    credentials: false,
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }),
);

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'Can Games API', timestamp: new Date().toISOString() }),
);
app.use('/api/games', gamesRoutes);
app.use('/api', collectionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/orders', ordersRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
