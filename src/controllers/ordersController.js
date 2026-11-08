import { placeOrder, listOrders } from '../services/orderService.js';

export function getOrders(req, res) {
  res.json({ data: listOrders(req.userId) });
}

export function createOrder(req, res) {
  res.status(201).json({ data: placeOrder(req.userId, req.body) });
}
