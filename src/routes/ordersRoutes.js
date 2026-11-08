import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { getOrders, createOrder } from '../controllers/ordersController.js';

const router = Router();

router.use(requireAuth);
router.get('/', getOrders);
router.post('/', createOrder);

export default router;
