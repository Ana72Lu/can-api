import { Router } from 'express';
import { login, logout } from '../controllers/sessionsController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireFields } from '../middlewares/validateRequest.js';

const router = Router();

router.post('/', requireFields(['email', 'password']), asyncHandler(login));
router.delete('/', logout);

export default router;
