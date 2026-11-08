import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';

describe('GET /health', () => {
  it('returns the API health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'Can Games API',
      }),
    );
    expect(response.body.timestamp).toBeDefined();
  });
});

describe('collection and checkout contracts', () => {
  it('returns collection entries using gameId without exposing the internal game snapshot', async () => {
    await request(app)
      .post('/api/cart')
      .send({
        game: { id: 'test-game-collection', title: 'Game for collection', priceInCents: 1200 },
      })
      .expect(201);

    const response = await request(app).get('/api/cart').expect(200);
    const entry = response.body.data.find((item) => item.gameId === 'test-game-collection');

    expect(entry).toEqual(
      expect.objectContaining({ gameId: 'test-game-collection', addedAt: expect.any(String) }),
    );
    expect(entry).not.toHaveProperty('game');
    expect(entry).not.toHaveProperty('gameSnapshot');
  });

  it('creates an order using the frontend request contract and grants the games to the library', async () => {
    const email = `checkout-${Date.now()}@example.com`;
    await request(app)
      .post('/api/users')
      .send({
        fullName: 'Checkout Test',
        nickname: `checkout${String(Date.now()).slice(-6)}`,
        birthDate: '2000-01-15',
        address: 'Rua de Teste, 10',
        email,
        password: 'CanGames123',
      })
      .expect(201);

    const login = await request(app)
      .post('/api/sessions')
      .send({ email, password: 'CanGames123' })
      .expect(200);
    const token = login.body.data.token;
    const auth = { Authorization: `Bearer ${token}` };
    const game = { id: 'test-game-order', title: 'Game for order', priceInCents: 2599 };

    await request(app).post('/api/cart').set(auth).send({ game }).expect(201);

    const checkout = await request(app)
      .post('/api/orders')
      .set(auth)
      .send({ gameIds: [game.id], paymentMethod: 'pix' })
      .expect(201);

    expect(checkout.body.data).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^CAN-[A-F0-9]{6}$/),
        gameIds: [game.id],
        paymentMethod: 'pix',
        total: 25.99,
        createdAt: expect.any(String),
      }),
    );

    const library = await request(app).get('/api/library').set(auth).expect(200);
    expect(library.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ gameId: game.id, addedAt: expect.any(String) }),
      ]),
    );

    const cart = await request(app).get('/api/cart').set(auth).expect(200);
    expect(cart.body.data).toHaveLength(0);
  });
});
